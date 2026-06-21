import { Controller, Get, Put, Delete, UseGuards, Param, Body } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  getUsers() {
    return this.adminService.getUsers();
  }

  @Put('users/:id/role')
  updateUserRole(
    @Param('id') userId: string,
    @Body('role') role: string,
    @CurrentUser() admin: any
  ) {
    return this.adminService.updateUserRole(userId, role, admin.id);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') userId: string, @CurrentUser() admin: any) {
    return this.adminService.deleteUser(userId, admin.id);
  }

  @Get('songs')
  getSongs() {
    return this.adminService.getSongs();
  }

  @Delete('songs/:id')
  deleteSong(@Param('id') songId: string) {
    return this.adminService.deleteSong(songId);
  }

  @Get('playlists')
  getPlaylists() {
    return this.adminService.getPlaylists();
  }

  @Delete('playlists/:id')
  deletePlaylist(@Param('id') playlistId: string) {
    return this.adminService.deletePlaylist(playlistId);
  }
}
