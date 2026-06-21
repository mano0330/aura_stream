import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class LibraryService {
  constructor(private readonly prisma: PrismaService) {}

  async toggleLike(userId: string, data: { targetId: string; targetType: 'SONG' | 'PLAYLIST'; songData?: { youtubeId: string; title: string; artistName: string; durationSeconds: number; thumbnailUrl?: string } }) {
    const { targetId, targetType, songData } = data;

    let resolvedTargetId = targetId;

    // 1. If we are liking a song, ensure the song is created and cached in our local database first
    if (targetType === 'SONG' && songData) {
      let song = await this.prisma.client.song.findUnique({
        where: { youtubeId: songData.youtubeId }
      });

      if (!song) {
        let artist = await this.prisma.client.artist.findUnique({
          where: { name: songData.artistName }
        });

        if (!artist) {
          artist = await this.prisma.client.artist.create({
            data: {
              name: songData.artistName,
              youtubeChannelId: `channel_${songData.youtubeId}`,
              bio: 'Artist discovered via library like'
            }
          });
        }

        song = await this.prisma.client.song.create({
          data: {
            youtubeId: songData.youtubeId,
            title: songData.title,
            artistId: artist.id,
            artistName: artist.name,
            durationSeconds: songData.durationSeconds,
            thumbnailUrl: songData.thumbnailUrl,
          }
        });
      }
      resolvedTargetId = song.id;
    }

    // 2. Check if like relation already exists
    const existingLike = await this.prisma.client.like.findUnique({
      where: {
        userId_targetId_targetType: {
          userId,
          targetId: resolvedTargetId,
          targetType,
        }
      }
    });

    if (existingLike) {
      // Unlike
      await this.prisma.client.like.delete({
        where: { id: existingLike.id }
      });
      return { liked: false, message: 'Removed from library favorites' };
    } else {
      // Like
      await this.prisma.client.like.create({
        data: {
          userId,
          targetId: resolvedTargetId,
          targetType,
        }
      });
      return { liked: true, message: 'Added to library favorites' };
    }
  }

  async getLikedSongs(userId: string) {
    const likes = await this.prisma.client.like.findMany({
      where: { userId, targetType: 'SONG' },
      orderBy: { createdAt: 'desc' },
    });

    const songIds = likes.map((l) => l.targetId);

    return this.prisma.client.song.findMany({
      where: { id: { in: songIds } },
      include: {
        artist: true
      }
    });
  }

  async addHistory(userId: string, songData: { youtubeId: string; title: string; artistName: string; durationSeconds: number; thumbnailUrl?: string; durationListenedSeconds?: number }) {
    // 1. Ensure song exists
    let song = await this.prisma.client.song.findUnique({
      where: { youtubeId: songData.youtubeId }
    });

    if (!song) {
      let artist = await this.prisma.client.artist.findUnique({
        where: { name: songData.artistName }
      });

      if (!artist) {
        artist = await this.prisma.client.artist.create({
          data: {
            name: songData.artistName,
            youtubeChannelId: `channel_${songData.youtubeId}`,
            bio: 'Artist discovered via history add'
          }
        });
      }

      song = await this.prisma.client.song.create({
        data: {
          youtubeId: songData.youtubeId,
          title: songData.title,
          artistId: artist.id,
          artistName: artist.name,
          durationSeconds: songData.durationSeconds,
          thumbnailUrl: songData.thumbnailUrl,
        }
      });
    }

    // 2. Add history record
    return this.prisma.client.listeningHistory.create({
      data: {
        userId,
        songId: song.id,
        durationListenedSeconds: songData.durationListenedSeconds || 0,
      },
      include: {
        song: true
      }
    });
  }

  async getHistory(userId: string) {
    return this.prisma.client.listeningHistory.findMany({
      where: { userId },
      include: {
        song: true
      },
      orderBy: { listenedAt: 'desc' },
      take: 50,
    });
  }
}
