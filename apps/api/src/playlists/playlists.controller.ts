import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { PlaylistsService } from './playlists.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('playlists')
@UseGuards(JwtAuthGuard)
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @Post()
  create(
    @CurrentUser() user: any,
    @Body() body: { title: string; description?: string; coverUrl?: string; isPrivate?: boolean; isCollaborative?: boolean }
  ) {
    return this.playlistsService.create(user.id, body);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.playlistsService.findAll(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.playlistsService.findOne(id, user.id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: { title?: string; description?: string; coverUrl?: string; isPrivate?: boolean; isCollaborative?: boolean }
  ) {
    return this.playlistsService.update(id, user.id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.playlistsService.remove(id, user.id);
  }

  @Post(':id/songs')
  addSong(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: { youtubeId: string; title: string; artistName: string; durationSeconds: number; thumbnailUrl?: string }
  ) {
    return this.playlistsService.addSong(id, user.id, body);
  }

  @Delete(':id/songs/:songId')
  removeSong(
    @Param('id') id: string,
    @Param('songId') songId: string,
    @CurrentUser() user: any
  ) {
    return this.playlistsService.removeSong(id, songId, user.id);
  }

  @Post(':id/collaborators')
  addCollaborator(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: { username: string }
  ) {
    return this.playlistsService.addCollaborator(id, user.id, body.username);
  }

  @Delete(':id/collaborators/:userId')
  removeCollaborator(
    @Param('id') id: string,
    @Param('userId') collaboratorId: string,
    @CurrentUser() user: any
  ) {
    return this.playlistsService.removeCollaborator(id, user.id, collaboratorId);
  }
}
