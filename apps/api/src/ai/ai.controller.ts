import { Controller, Post, Body, Get, UseGuards, Query } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /**
   * POST /ai/playlist
   * Generate an AI playlist from natural language prompt.
   * Auth optional — guests can generate but cannot save.
   */
  @Post('playlist')
  generatePlaylist(@Body() body: { prompt: string }) {
    return this.aiService.generatePlaylist(body.prompt);
  }

  /**
   * GET /ai/search?q=...
   * Natural language music search — converts query intent to tracks.
   */
  @Get('search')
  naturalLanguageSearch(@Query('q') query: string) {
    return this.aiService.naturalLanguageSearch(query);
  }

  /**
   * POST /ai/dj/intro
   * AI DJ track introduction generator.
   */
  @Post('dj/intro')
  djIntroduction(
    @Body() body: {
      currentTrack: { title: string; artistName: string };
      nextTrack?: { title: string; artistName: string };
    },
  ) {
    return this.aiService
      .djIntroduction(body.currentTrack, body.nextTrack)
      .then((intro) => ({ intro }));
  }

  /**
   * POST /ai/dj/chat
   * Conversational AI DJ chat.
   */
  @Post('dj/chat')
  djChat(
    @Body() body: {
      message: string;
      history?: Array<{ role: 'user' | 'assistant'; content: string }>;
    },
  ) {
    return this.aiService
      .djChat(body.message, body.history || [])
      .then((reply) => ({ reply }));
  }
}
