import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // Get all users enriched with listening stats
  async getUsersWithInsights() {
    const users = await this.prisma.client.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            playlists: true,
            followers: true,
            following: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Enrich each user with listening stats
    const enriched = await Promise.all(
      users.map(async (u) => {
        const history = await this.prisma.client.listeningHistory.aggregate({
          where: { userId: u.id },
          _sum: { durationListenedSeconds: true },
          _count: { id: true },
        });

        // Last listened song
        const lastListen = await this.prisma.client.listeningHistory.findFirst({
          where: { userId: u.id },
          orderBy: { listenedAt: 'desc' },
          include: { song: { select: { title: true, artistName: true, thumbnailUrl: true } } },
        });

        return {
          ...u,
          totalListens: history._count.id,
          totalListeningSeconds: history._sum.durationListenedSeconds || 0,
          lastActiveAt: lastListen?.listenedAt || null,
          lastSong: lastListen?.song || null,
        };
      }),
    );

    return enriched;
  }

  // Deep insights for a single user
  async getUserInsights(userId: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true, avatarUrl: true, role: true, createdAt: true },
    });
    if (!user) throw new NotFoundException('User not found');

    // Total listening stats
    const totalStats = await this.prisma.client.listeningHistory.aggregate({
      where: { userId },
      _sum: { durationListenedSeconds: true },
      _count: { id: true },
    });

    // Top 10 most played songs
    const topSongs = await this.prisma.client.listeningHistory.groupBy({
      by: ['songId'],
      where: { userId },
      _count: { songId: true },
      _sum: { durationListenedSeconds: true },
      orderBy: { _count: { songId: 'desc' } },
      take: 10,
    });

    const topSongsWithDetails = await Promise.all(
      topSongs.map(async (ts) => {
        const song = await this.prisma.client.song.findUnique({
          where: { id: ts.songId },
          select: { title: true, artistName: true, thumbnailUrl: true, youtubeId: true },
        });
        return { song, playCount: ts._count.songId, totalSeconds: ts._sum.durationListenedSeconds || 0 };
      }),
    );

    // Recent activity (last 20 listens)
    const recentActivity = await this.prisma.client.listeningHistory.findMany({
      where: { userId },
      include: { song: { select: { title: true, artistName: true, thumbnailUrl: true } } },
      orderBy: { listenedAt: 'desc' },
      take: 20,
    });

    // Daily listening for past 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weeklyHistory = await this.prisma.client.listeningHistory.findMany({
      where: { userId, listenedAt: { gte: sevenDaysAgo } },
      select: { listenedAt: true, durationListenedSeconds: true },
    });

    // Group by day
    const dailyMap: Record<string, number> = {};
    weeklyHistory.forEach((h) => {
      const day = h.listenedAt.toISOString().split('T')[0];
      dailyMap[day] = (dailyMap[day] || 0) + (h.durationListenedSeconds || 0);
    });

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().split('T')[0];
      return { date: key, seconds: dailyMap[key] || 0 };
    });

    return {
      user,
      totalListens: totalStats._count.id,
      totalListeningSeconds: totalStats._sum.durationListenedSeconds || 0,
      topSongs: topSongsWithDetails,
      recentActivity,
      last7Days,
    };
  }

  // Get recent activity across ALL users (live feed for admin)
  async getGlobalActivityFeed() {
    const recent = await this.prisma.client.listeningHistory.findMany({
      include: {
        user: { select: { id: true, username: true, avatarUrl: true, email: true } },
        song: { select: { title: true, artistName: true, thumbnailUrl: true } },
      },
      orderBy: { listenedAt: 'desc' },
      take: 50,
    });
    return recent;
  }

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
