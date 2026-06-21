import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PlaylistsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, data: { title: string; description?: string; coverUrl?: string; isPrivate?: boolean; isCollaborative?: boolean }) {
    return this.prisma.client.playlist.create({
      data: {
        title: data.title,
        description: data.description,
        coverUrl: data.coverUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=300&h=300&q=80', // default cover
        ownerId: userId,
        isPrivate: data.isPrivate ?? false,
        isCollaborative: data.isCollaborative ?? false,
      },
      include: {
        owner: {
          select: { id: true, username: true }
        }
      }
    });
  }

  async findAll(userId: string) {
    return this.prisma.client.playlist.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { collaborators: { some: { userId } } },
          { isPrivate: false }
        ]
      },
      include: {
        owner: {
          select: { id: true, username: true }
        },
        _count: {
          select: { playlistSongs: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async findOne(playlistId: string, userId: string) {
    const playlist = await this.prisma.client.playlist.findUnique({
      where: { id: playlistId },
      include: {
        owner: {
          select: { id: true, username: true }
        },
        collaborators: {
          include: {
            user: {
              select: { id: true, username: true, avatarUrl: true }
            }
          }
        },
        playlistSongs: {
          include: {
            song: {
              include: {
                artist: true
              }
            }
          },
          orderBy: { position: 'asc' }
        }
      }
    });

    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    if (playlist.isPrivate && playlist.ownerId !== userId && !playlist.collaborators.some(c => c.userId === userId)) {
      throw new ForbiddenException('This playlist is private');
    }

    return playlist;
  }

  async update(playlistId: string, userId: string, data: { title?: string; description?: string; coverUrl?: string; isPrivate?: boolean; isCollaborative?: boolean }) {
    const playlist = await this.findOne(playlistId, userId);
    
    if (playlist.ownerId !== userId) {
      throw new ForbiddenException('Only the owner can edit playlist details');
    }

    return this.prisma.client.playlist.update({
      where: { id: playlistId },
      data,
    });
  }

  async remove(playlistId: string, userId: string) {
    const playlist = await this.findOne(playlistId, userId);

    if (playlist.ownerId !== userId) {
      throw new ForbiddenException('Only the owner can delete this playlist');
    }

    await this.prisma.client.playlist.delete({
      where: { id: playlistId }
    });

    return { message: 'Playlist deleted successfully' };
  }

  async addSong(playlistId: string, userId: string, songData: { youtubeId: string; title: string; artistName: string; durationSeconds: number; thumbnailUrl?: string }) {
    const playlist = await this.findOne(playlistId, userId);

    const isOwner = playlist.ownerId === userId;
    const isCollaborator = playlist.collaborators.some(c => c.userId === userId);

    if (!isOwner && (!playlist.isCollaborative || !isCollaborator)) {
      throw new ForbiddenException('You do not have permission to add tracks to this playlist');
    }

    // 1. Ensure song is cached in DB
    let song = await this.prisma.client.song.findUnique({
      where: { youtubeId: songData.youtubeId }
    });

    if (!song) {
      let artist = await this.prisma.client.artist.findUnique({
        where: { name: songData.artistName }
      });

      if (!artist) {
        artist = await this.prisma.client.artist.create({
          data: {
            name: songData.artistName,
            youtubeChannelId: `channel_${songData.youtubeId}`,
            bio: 'Artist discovered via playlist add'
          }
        });
      }

      song = await this.prisma.client.song.create({
        data: {
          youtubeId: songData.youtubeId,
          title: songData.title,
          artistId: artist.id,
          artistName: artist.name,
          durationSeconds: songData.durationSeconds,
          thumbnailUrl: songData.thumbnailUrl,
        }
      });
    }

    // 2. Add song to playlist
    const count = await this.prisma.client.playlistSong.count({
      where: { playlistId }
    });

    // Check if song already exists in playlist to avoid duplicate adds in same position
    const existingRelation = await this.prisma.client.playlistSong.findFirst({
      where: { playlistId, songId: song.id }
    });

    if (existingRelation) {
      return { message: 'Song already in playlist', playlistSong: existingRelation };
    }

    const playlistSong = await this.prisma.client.playlistSong.create({
      data: {
        playlistId,
        songId: song.id,
        position: count + 1,
      },
      include: {
        song: true
      }
    });

    return { message: 'Song added to playlist', playlistSong };
  }

  async removeSong(playlistId: string, songId: string, userId: string) {
    const playlist = await this.findOne(playlistId, userId);

    const isOwner = playlist.ownerId === userId;
    const isCollaborator = playlist.collaborators.some(c => c.userId === userId);

    if (!isOwner && (!playlist.isCollaborative || !isCollaborator)) {
      throw new ForbiddenException('You do not have permission to edit this playlist');
    }

    await this.prisma.client.playlistSong.deleteMany({
      where: { playlistId, songId }
    });

    return { message: 'Song removed from playlist' };
  }

  async addCollaborator(playlistId: string, ownerId: string, targetUsername: string) {
    const playlist = await this.findOne(playlistId, ownerId);

    if (playlist.ownerId !== ownerId) {
      throw new ForbiddenException('Only the owner can add collaborators');
    }

    const targetUser = await this.prisma.client.user.findUnique({
      where: { username: targetUsername }
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    const collab = await this.prisma.client.collaborativePlaylist.upsert({
      where: {
        playlistId_userId: {
          playlistId,
          userId: targetUser.id
        }
      },
      update: {},
      create: {
        playlistId,
        userId: targetUser.id
      }
    });

    return { message: 'Collaborator added', collaborator: targetUser };
  }

  async removeCollaborator(playlistId: string, ownerId: string, collaboratorId: string) {
    const playlist = await this.findOne(playlistId, ownerId);

    if (playlist.ownerId !== ownerId) {
      throw new ForbiddenException('Only the owner can remove collaborators');
    }

    await this.prisma.client.collaborativePlaylist.deleteMany({
      where: { playlistId, userId: collaboratorId }
    });

    return { message: 'Collaborator removed successfully' };
  }
}
