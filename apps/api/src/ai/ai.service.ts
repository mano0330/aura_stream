import { Injectable, Logger } from '@nestjs/common';
import { AiClientService } from './ai-client.service';
import { MusicService } from '../music/music.service';

export interface GeneratedPlaylist {
  playlistTitle: string;
  description: string;
  tracks: Array<{
    youtubeId: string;
    title: string;
    artistName: string;
    thumbnailUrl?: string;
    durationSeconds: number;
  }>;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly aiClient: AiClientService,
    private readonly musicService: MusicService,
  ) {}

  /**
   * Generate a playlist from a natural language prompt.
   * e.g. "Create a coding playlist with ambient and lofi vibes"
   */
  async generatePlaylist(prompt: string): Promise<GeneratedPlaylist> {
    const systemPrompt = `You are an expert music curator AI for Aura Stream, a premium music platform.
Your job is to create curated playlists based on user requests.

When given a playlist request, respond with ONLY a valid JSON object (no markdown, no extra text) in this exact format:
{
  "playlistTitle": "string",
  "description": "string (1-2 sentences describing the mood/vibe)",
  "searchQueries": ["query1", "query2", "query3", "query4", "query5"]
}

Rules:
- playlistTitle should be creative and evocative (not generic)
- searchQueries should be 4-6 specific YouTube search queries that will find great tracks for this mood
- Make queries specific enough to find good music (e.g. "Hans Zimmer interstellar soundtrack" not just "music")
- Consider genre, tempo, mood, and era in your queries
- Never include artist names that don't exist`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: `Create a playlist for: ${prompt}` },
    ];

    let parsed: { playlistTitle: string; description: string; searchQueries: string[] };

    try {
      const rawResponse = await this.aiClient.chat(messages);
      // Extract JSON from response (handles markdown code blocks)
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in AI response');
      parsed = JSON.parse(jsonMatch[0]);
    } catch (err) {
      this.logger.error('Failed to parse AI playlist response, using fallback', err);
      // Structured fallback
      parsed = {
        playlistTitle: 'Aura AI Mix',
        description: 'A personalized playlist curated just for you.',
        searchQueries: [`${prompt} music`, `best ${prompt} songs`, `${prompt} playlist hits`],
      };
    }

    // Search YouTube for each query and collect tracks
    const tracks: GeneratedPlaylist['tracks'] = [];
    const seenIds = new Set<string>();

    for (const query of (parsed.searchQueries || []).slice(0, 6)) {
      try {
        const results = await this.musicService.searchTracks(query);
        for (const track of results.slice(0, 2)) {
          if (!seenIds.has(track.youtubeId)) {
            seenIds.add(track.youtubeId);
            tracks.push(track);
          }
        }
      } catch (e) {
        this.logger.warn(`Search failed for query "${query}": ${e}`);
      }
    }

    return {
      playlistTitle: parsed.playlistTitle,
      description: parsed.description,
      tracks,
    };
  }

  /**
   * Natural Language Search — understand intent and convert to smart queries.
   * e.g. "Songs like the Interstellar soundtrack" → structured YouTube queries
   */
  async naturalLanguageSearch(query: string): Promise<Array<{
    youtubeId: string;
    title: string;
    artistName: string;
    thumbnailUrl?: string;
    durationSeconds: number;
  }>> {
    const systemPrompt = `You are a music search expert for Aura Stream.
Convert the user's natural language music query into 2-3 specific YouTube search queries.

Respond ONLY with valid JSON (no markdown):
{
  "queries": ["specific query 1", "specific query 2", "specific query 3"]
}

Rules:
- Be very specific — name artists, genres, years, moods
- Focus on finding real, popular tracks that match the intent
- If user asks "songs like X", find similar artists/styles`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: query },
    ];

    let queries: string[] = [query];

    try {
      const rawResponse = await this.aiClient.chat(messages);
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        queries = parsed.queries || [query];
      }
    } catch (e) {
      this.logger.warn('NL search AI parse failed, using raw query', e);
    }

    const tracks: any[] = [];
    const seenIds = new Set<string>();

    for (const q of queries.slice(0, 3)) {
      try {
        const results = await this.musicService.searchTracks(q);
        for (const track of results.slice(0, 5)) {
          if (!seenIds.has(track.youtubeId)) {
            seenIds.add(track.youtubeId);
            tracks.push(track);
          }
        }
      } catch (e) {
        this.logger.warn(`NL search failed for "${q}": ${e}`);
      }
    }

    return tracks;
  }

  /**
   * AI DJ — introduce the current track and suggest what's coming next.
   */
  async djIntroduction(currentTrack: { title: string; artistName: string }, nextTrack?: { title: string; artistName: string }): Promise<string> {
    const systemPrompt = `You are Aura, an AI DJ for a premium music streaming platform called Aura Stream.
Your personality is: warm, knowledgeable, slightly mystical, and enthusiastic about music.
Keep your intros short (2-3 sentences max). Be conversational and engaging.
Do NOT use emojis. Do NOT be too formal.`;

    let userPrompt = `You just played "${currentTrack.title}" by ${currentTrack.artistName}.`;
    if (nextTrack) {
      userPrompt += ` Next up is "${nextTrack.title}" by ${nextTrack.artistName}. Give a short DJ intro bridging these two tracks.`;
    } else {
      userPrompt += ` Give a short DJ outro/commentary on this track.`;
    }

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt },
    ];

    try {
      const response = await this.aiClient.chat(messages);
      return response.trim();
    } catch (e) {
      // Fallback DJ line
      return `That was "${currentTrack.title}" by ${currentTrack.artistName} — a beautiful piece that never gets old. Stay tuned for what's coming next on Aura Stream.`;
    }
  }

  /**
   * Chat with AI DJ in conversational mode.
   */
  async djChat(userMessage: string, conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>): Promise<string> {
    const systemPrompt = `You are Aura, an AI DJ and music expert for Aura Stream.
You help users discover music, explain music history, suggest tracks, and create playlists.
Be helpful, knowledgeable, and conversational. Keep responses concise (3-5 sentences).
When recommending music, mention specific artist names and song titles.
Do NOT use emojis. Be warm and engaging.`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversationHistory.slice(-8), // Keep last 8 messages for context
      { role: 'user' as const, content: userMessage },
    ];

    try {
      return await this.aiClient.chat(messages);
    } catch (e) {
      return "I'm having a moment of static right now. Try asking me again — I'd love to help you find the perfect music.";
    }
  }
}
