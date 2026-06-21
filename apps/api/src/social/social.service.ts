import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SocialService {
  constructor(private readonly prisma: PrismaService) {}

  async followUser(followerId: string, targetUsername: string) {
    const targetUser = await this.prisma.client.user.findUnique({
      where: { username: targetUsername },
    });

    if (!targetUser) throw new NotFoundException('User not found');
    if (targetUser.id === followerId) throw new ConflictException('You cannot follow yourself');

    const existing = await this.prisma.client.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId: targetUser.id } },
    });

    if (existing) {
      // Unfollow
      await this.prisma.client.follow.delete({ where: { id: existing.id } });
      return { following: false, message: `Unfollowed ${targetUsername}` };
    }

    await this.prisma.client.follow.create({
      data: { followerId, followingId: targetUser.id },
    });
    return { following: true, message: `Now following ${targetUsername}` };
  }

  async getFollowers(userId: string) {
    const follows = await this.prisma.client.follow.findMany({
      where: { followingId: userId },
      include: { follower: { select: { id: true, username: true, avatarUrl: true, bio: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return follows.map(f => f.follower);
  }

  async getFollowing(userId: string) {
    const follows = await this.prisma.client.follow.findMany({
      where: { followerId: userId },
      include: { following: { select: { id: true, username: true, avatarUrl: true, bio: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return follows.map(f => f.following);
  }

  async addComment(userId: string, songId: string, content: string) {
    // Verify song exists
    const song = await this.prisma.client.song.findUnique({ where: { id: songId } });
    if (!song) throw new NotFoundException('Song not found');

    return this.prisma.client.comment.create({
      data: { userId, songId, content },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
      },
    });
  }

  async getComments(songId: string) {
    return this.prisma.client.comment.findMany({
      where: { songId },
      include: { user: { select: { id: true, username: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.prisma.client.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.userId !== userId) throw new ConflictException('Cannot delete another user\'s comment');

    await this.prisma.client.comment.delete({ where: { id: commentId } });
    return { message: 'Comment deleted' };
  }

  async getActivityFeed(userId: string) {
    // Get the list of users the current user follows
    const following = await this.prisma.client.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followingIds = following.map(f => f.followingId);

    if (followingIds.length === 0) return [];

    // Fetch recent listening history of followed users
    const recentHistory = await this.prisma.client.listeningHistory.findMany({
      where: { userId: { in: followingIds } },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
        song: true,
      },
      orderBy: { listenedAt: 'desc' },
      take: 30,
    });

    return recentHistory.map(h => ({
      type: 'LISTENED',
      user: h.user,
      song: h.song,
      timestamp: h.listenedAt,
    }));
  }
}
