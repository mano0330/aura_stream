import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        bio: true,
        role: true,
        createdAt: true,
        preferences: true,
        _count: {
          select: {
            playlists: true,
            followers: true,
            following: true,
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, data: { bio?: string; avatarUrl?: string; username?: string; preferences?: string }) {
    if (data.username) {
      const existing = await this.prisma.client.user.findFirst({
        where: {
          username: data.username,
          NOT: { id: userId }
        }
      });
      if (existing) {
        throw new BadRequestException('Username already taken');
      }
    }

    const updated = await this.prisma.client.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        bio: true,
        role: true,
        preferences: true,
        updatedAt: true,
      }
    });

    return {
      message: 'Profile updated successfully',
      user: updated
    };
  }

  async discoverListeners(currentUserId: string) {
    // Get users that currentUserId follows
    const follows = await this.prisma.client.follow.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true }
    });
    const followingIds = follows.map(f => f.followingId);

    // Return other users that they don't follow yet
    return this.prisma.client.user.findMany({
      where: {
        id: {
          notIn: [currentUserId, ...followingIds]
        }
      },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        bio: true,
      },
      take: 6
    });
  }

  async getPublicProfile(username: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        playlists: {
          where: { isPrivate: false },
          select: {
            id: true,
            title: true,
            description: true,
            coverUrl: true,
            createdAt: true,
          }
        },
        _count: {
          select: {
            followers: true,
            following: true,
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
