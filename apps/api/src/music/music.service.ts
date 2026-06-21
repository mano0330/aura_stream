import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface TrackResult {
  youtubeId: string;
  title: string;
  artistName: string;
  thumbnailUrl: string | null;
  durationSeconds: number;
}

@Injectable()
export class MusicService {
  private readonly logger = new Logger(MusicService.name);
  private readonly youtubeApiKey = process.env.YOUTUBE_API_KEY;

  // In-memory search cache to conserve YouTube API quota (100 units/search)
  private readonly searchCache = new Map<string, { results: TrackResult[]; expiresAt: number }>();
  private readonly CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

  constructor(private readonly prisma: PrismaService) {}

  async searchTracks(query: string): Promise<TrackResult[]> {
    if (!query || query.trim() === '') {
      throw new BadRequestException('Search query is required');
    }

    const cacheKey = query.toLowerCase().trim();
    const cached = this.searchCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      this.logger.debug(`Cache HIT for query: "${query}"`);
      return cached.results;
    }

    if (this.youtubeApiKey) {
      try {
        const ytSongs = await this.searchYouTube(query);
        // Cache result
        this.searchCache.set(cacheKey, {
          results: ytSongs,
          expiresAt: Date.now() + this.CACHE_TTL_MS,
        });
        // Async background caching to DB (don't await — non-blocking)
        this.cacheSongsToDB(ytSongs).catch((e) =>
          this.logger.warn(`DB cache failed for "${query}": ${(e as Error).message}`),
        );
        return ytSongs;
      } catch (e) {
        this.logger.error(`YouTube API search failed for "${query}": ${(e as Error).message}`);
        // Fall through to local DB
      }
    } else {
      this.logger.warn('YOUTUBE_API_KEY not set — returning local DB results only');
    }

    const localSongs = await this.prisma.client.song.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { artistName: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 15,
    });

    return this.formatLocalSongs(localSongs);
  }

  async getTrending(): Promise<TrackResult[]> {
    const cacheKey = '__trending__';
    const cached = this.searchCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.results;
    }

    if (this.youtubeApiKey) {
      try {
        const trendingUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&chart=mostPopular&videoCategoryId=10&regionCode=IN&maxResults=20&key=${this.youtubeApiKey}`;
        const res = await fetch(trendingUrl);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error?.message || 'YouTube trending API error');
        }

        const results: TrackResult[] = (data.items || []).map((item: any) => {
          const durationSeconds = this.parseIsoDuration(item.contentDetails?.duration || 'PT3M0S');
          const channelTitle = item.snippet?.channelTitle || 'Unknown Artist';
          const cleanArtist = channelTitle.replace(/ - Topic|VEVO/g, '').trim();

          return {
            youtubeId: item.id,
            title: item.snippet?.title || 'Unknown Title',
            artistName: cleanArtist,
            thumbnailUrl:
              item.snippet?.thumbnails?.medium?.url ||
              item.snippet?.thumbnails?.default?.url ||
              null,
            durationSeconds,
          };
        });

        this.searchCache.set(cacheKey, {
          results,
          expiresAt: Date.now() + this.CACHE_TTL_MS,
        });

        return results;
      } catch (e) {
        this.logger.error(`YouTube trending fetch failed: ${(e as Error).message}`);
      }
    }

    // Fallback: return recent songs from DB
    const localSongs = await this.prisma.client.song.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return this.formatLocalSongs(localSongs);
  }

  private async searchYouTube(query: string): Promise<TrackResult[]> {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=15&q=${encodeURIComponent(
      query + ' music',
    )}&type=video&videoCategoryId=10&key=${this.youtubeApiKey}`;

    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchRes.ok) {
      throw new Error(searchData.error?.message || 'YouTube search API error');
    }

    const items = searchData.items || [];
    if (items.length === 0) return [];

    const videoIds = items
      .map((item: any) => item.id.videoId)
      .filter(Boolean)
      .join(',');
    if (!videoIds) return [];

    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds}&key=${this.youtubeApiKey}`;
    const detailsRes = await fetch(detailsUrl);
    const detailsData = await detailsRes.json();

    if (!detailsRes.ok) {
      throw new Error(detailsData.error?.message || 'YouTube details API error');
    }

    return (detailsData.items || []).map((item: any) => {
      const durationSeconds = this.parseIsoDuration(item.contentDetails?.duration || 'PT3M0S');
      const channelTitle = item.snippet?.channelTitle || 'Unknown Artist';
      const cleanArtist = channelTitle.replace(/ - Topic|VEVO/g, '').trim();

      return {
        youtubeId: item.id,
        title: item.snippet?.title || 'Unknown Title',
        artistName: cleanArtist,
        thumbnailUrl:
          item.snippet?.thumbnails?.medium?.url ||
          item.snippet?.thumbnails?.default?.url ||
          null,
        durationSeconds,
      };
    });
  }

  private async cacheSongsToDB(songs: TrackResult[]): Promise<void> {
    for (const song of songs) {
      try {
        let artist = await this.prisma.client.artist.findFirst({
          where: { name: song.artistName },
        });

        if (!artist) {
          artist = await this.prisma.client.artist.create({
            data: {
              name: song.artistName,
              youtubeChannelId: `channel_search_${song.youtubeId}`,
            },
          });
        }

        await this.prisma.client.song.upsert({
          where: { youtubeId: song.youtubeId },
          update: {
            title: song.title,
            thumbnailUrl: song.thumbnailUrl,
          },
          create: {
            youtubeId: song.youtubeId,
            title: song.title,
            artistId: artist.id,
            artistName: artist.name,
            durationSeconds: song.durationSeconds,
            thumbnailUrl: song.thumbnailUrl,
          },
        });
      } catch (e) {
        // Silently skip DB cache failures — they are non-critical
      }
    }
  }

  private formatLocalSongs(songs: any[]): TrackResult[] {
    return songs.map((s) => ({
      youtubeId: s.youtubeId,
      title: s.title,
      artistName: s.artistName,
      thumbnailUrl: s.thumbnailUrl,
      durationSeconds: s.durationSeconds,
    }));
  }

  async getSuggestions(query: string): Promise<string[]> {
    if (!query || query.trim() === '') {
      return [];
    }
    try {
      const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      const data = await res.json();
      return data[1] || [];
    } catch (e) {
      const localSongs = await this.prisma.client.song.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { artistName: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 6,
      });
      return localSongs.map(s => `${s.title} - ${s.artistName}`);
    }
  }

  parseIsoDuration(duration: string): number {
    const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!matches) return 180;

    const hours = parseInt(matches[1] || '0', 10);
    const minutes = parseInt(matches[2] || '0', 10);
    const seconds = parseInt(matches[3] || '0', 10);

    return hours * 3600 + minutes * 60 + seconds;
  }
}
