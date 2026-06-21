import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const totalUsers = await this.prisma.client.user.count();
    const totalSongs = await this.prisma.client.song.count();
    const totalPlaylists = await this.prisma.client.playlist.count();
    const totalListens = await this.prisma.client.listeningHistory.count();

    const durationResult = await this.prisma.client.listeningHistory.aggregate({
      _sum: {
        durationListenedSeconds: true,
      },
    });

    return {
      users: totalUsers,
      songs: totalSongs,
      playlists: totalPlaylists,
      totalListens,
      totalListeningDurationSeconds: durationResult._sum.durationListenedSeconds || 0,
    };
  }

  async getUsers() {
    return this.prisma.client.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        bio: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateUserRole(userId: string, targetRole: string, currentAdminId: string) {
    if (userId === currentAdminId) {
      throw new ForbiddenException('You cannot modify your own role');
    }

    if (targetRole !== 'USER' && targetRole !== 'ADMIN') {
      throw new BadRequestException('Invalid role. Role must be USER or ADMIN');
    }

    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.client.user.update({
      where: { id: userId },
      data: { role: targetRole },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
      },
    });

    return {
      message: `User role updated to ${targetRole} successfully`,
      user: updated,
    };
  }

  async deleteUser(userId: string, currentAdminId: string) {
    if (userId === currentAdminId) {
      throw new ForbiddenException('You cannot delete your own admin account');
    }

    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.client.user.delete({
      where: { id: userId },
    });

    return {
      message: 'User and all associated data deleted successfully',
    };
  }

  async getSongs() {
    return this.prisma.client.song.findMany({
      select: {
        id: true,
        youtubeId: true,
        title: true,
        artistName: true,
        thumbnailUrl: true,
        durationSeconds: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async deleteSong(songId: string) {
    const song = await this.prisma.client.song.findUnique({
      where: { id: songId },
    });

    if (!song) {
      throw new NotFoundException('Song not found');
    }

    await this.prisma.client.song.delete({
      where: { id: songId },
    });

    return {
      message: 'Song deleted successfully',
    };
  }

  async getPlaylists() {
    return this.prisma.client.playlist.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        coverUrl: true,
        isPrivate: true,
        isCollaborative: true,
        createdAt: true,
        owner: {
          select: {
            username: true,
            email: true,
          },
        },
        _count: {
          select: {
            playlistSongs: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async deletePlaylist(playlistId: string) {
    const playlist = await this.prisma.client.playlist.findUnique({
      where: { id: playlistId },
    });

    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    await this.prisma.client.playlist.delete({
      where: { id: playlistId },
    });

    return {
      message: 'Playlist deleted successfully',
    };
  }
}
