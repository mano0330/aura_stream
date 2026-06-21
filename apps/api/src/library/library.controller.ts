import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { LibraryService } from './library.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('library')
@UseGuards(JwtAuthGuard)
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Post('likes')
  toggleLike(
    @CurrentUser() user: any,
    @Body() body: { targetId: string; targetType: 'SONG' | 'PLAYLIST'; songData?: { youtubeId: string; title: string; artistName: string; durationSeconds: number; thumbnailUrl?: string } }
  ) {
    return this.libraryService.toggleLike(user.id, body);
  }

  @Get('likes/songs')
  getLikedSongs(@CurrentUser() user: any) {
    return this.libraryService.getLikedSongs(user.id);
  }

  @Post('history')
  addHistory(
    @CurrentUser() user: any,
    @Body() body: { youtubeId: string; title: string; artistName: string; durationSeconds: number; thumbnailUrl?: string; durationListenedSeconds?: number }
  ) {
    return this.libraryService.addHistory(user.id, body);
  }

  @Get('history')
  getHistory(@CurrentUser() user: any) {
    return this.libraryService.getHistory(user.id);
  }
}
