import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { MusicService } from './music.service';

@ApiTags('music')
@Controller('music')
export class MusicController {
  constructor(private readonly musicService: MusicService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search YouTube music videos' })
  @ApiQuery({ name: 'q', description: 'Search query', example: 'Hans Zimmer Interstellar' })
  search(@Query('q') query: string) {
    return this.musicService.searchTracks(query);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get search suggestions' })
  @ApiQuery({ name: 'q', description: 'Search input text', example: 'Hans' })
  suggestions(@Query('q') query: string) {
    return this.musicService.getSuggestions(query);
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending music videos from YouTube' })
  trending() {
    return this.musicService.getTrending();
  }

  @Get('genre')
  @ApiOperation({ summary: 'Get music by genre/mood keyword' })
  @ApiQuery({ name: 'mood', description: 'Mood or genre', example: 'lofi chill study' })
  getByMood(@Query('mood') mood: string) {
    return this.musicService.searchTracks(mood);
  }
}
