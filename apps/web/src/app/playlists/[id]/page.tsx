'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Play, Pause, ArrowLeft, Trash2, UserPlus, Music, 
  Clock, Lock, Globe, Users, Loader2, PlusCircle
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { usePlayerStore, Track } from '@/store/playerStore';
import Link from 'next/link';

export default function PlaylistDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const playlistId = params.id as string;
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const { playTrack, currentTrack, isPlaying, setQueue } = usePlayerStore();

  const [playlist, setPlaylist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/login';
    }
  }, [isLoading, isAuthenticated]);
  
  // Collaborator state
  const [collabUsername, setCollabUsername] = useState('');
  const [collabSuccess, setCollabSuccess] = useState('');
  const [collabError, setCollabError] = useState('');
  
  // Edit state
  const [isPrivate, setIsPrivate] = useState(false);
  const [isCollaborative, setIsCollaborative] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPlaylist();
    }
  }, [playlistId, isAuthenticated]);

  const fetchPlaylist = async () => {
    setLoading(true);
    try {
      if (playlistId === 'favorites') {
        const songs = await fetchApi('/library/likes/songs');
        const favoritesPlaylist = {
          id: 'favorites',
          title: 'Favorites',
          description: 'Your liked songs automatically saved to your account',
          isPrivate: true,
          isCollaborative: false,
          ownerId: user?.id,
          owner: { username: user?.username || 'You' },
          coverUrl: 'https://images.unsplash.com/photo-1513829096960-ef0931497990?auto=format&fit=crop&w=400&h=400',
          collaborators: [],
          playlistSongs: (songs || []).map((s: any) => ({
            id: s.id,
            song: s
          }))
        };
        setPlaylist(favoritesPlaylist);
        setIsPrivate(true);
        setIsCollaborative(false);
      } else {
        const data = await fetchApi(`/playlists/${playlistId}`);
        setPlaylist(data);
        setIsPrivate(data.isPrivate);
        setIsCollaborative(data.isCollaborative);
      }
    } catch (err: any) {
      setError(err.message || 'Could not load playlist');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPlaylist = () => {
    if (!playlist || playlist.playlistSongs.length === 0) return;
    const tracks: Track[] = playlist.playlistSongs.map((ps: any) => ({
      id: ps.song.id,
      youtubeId: ps.song.youtubeId,
      title: ps.song.title,
      artistName: ps.song.artistName,
      thumbnailUrl: ps.song.thumbnailUrl,
      durationSeconds: ps.song.durationSeconds,
    }));
    setQueue(tracks, 0);
  };

  const handleTrackPlay = (song: any, index: number) => {
    const tracks: Track[] = playlist.playlistSongs.map((ps: any) => ({
      id: ps.song.id,
      youtubeId: ps.song.youtubeId,
      title: ps.song.title,
      artistName: ps.song.artistName,
      thumbnailUrl: ps.song.thumbnailUrl,
      durationSeconds: ps.song.durationSeconds,
    }));
    setQueue(tracks, index);
  };

  const handleRemoveTrack = async (songId: string) => {
    try {
      if (playlistId === 'favorites') {
        const psItem = playlist.playlistSongs.find((ps: any) => ps.song.id === songId);
        if (!psItem) return;
        const song = psItem.song;
        await fetchApi('/library/likes', {
          method: 'POST',
          body: JSON.stringify({
            targetId: song.youtubeId,
            targetType: 'SONG',
            songData: {
              youtubeId: song.youtubeId,
              title: song.title,
              artistName: song.artistName,
              durationSeconds: song.durationSeconds,
              thumbnailUrl: song.thumbnailUrl
            }
          })
        });
      } else {
        await fetchApi(`/playlists/${playlistId}/songs/${songId}`, {
          method: 'DELETE',
        });
      }
      // Refresh local view
      setPlaylist({
        ...playlist,
        playlistSongs: playlist.playlistSongs.filter((ps: any) => ps.song.id !== songId),
      });
    } catch (err: any) {
      alert(err.message || 'Failed to remove song');
    }
  };

  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    setCollabError('');
    setCollabSuccess('');

    try {
      const data = await fetchApi(`/playlists/${playlistId}/collaborators`, {
        method: 'POST',
        body: JSON.stringify({ username: collabUsername }),
      });
      setCollabSuccess(`Successfully added ${collabUsername}!`);
      setCollabUsername('');
      // Refresh playlist details
      fetchPlaylist();
    } catch (err: any) {
      setCollabError(err.message || 'Could not add collaborator');
    }
  };

  const handleToggleSettings = async (field: 'isPrivate' | 'isCollaborative', value: boolean) => {
    try {
      const data = await fetchApi(`/playlists/${playlistId}`, {
        method: 'PUT',
        body: JSON.stringify({ [field]: value }),
      });
      if (field === 'isPrivate') setIsPrivate(data.isPrivate);
      if (field === 'isCollaborative') setIsCollaborative(data.isCollaborative);
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    }
  };

  const formatSongDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="min-h-screen bg-[#060610] flex flex-col items-center justify-center text-white px-4">
        <h2 className="text-2xl font-bold text-red-400 mb-2">Error loading playlist</h2>
        <p className="text-zinc-400 mb-6">{error || 'Playlist could not be found'}</p>
        <Link href="/" className="bg-white/5 border border-white/10 px-6 py-2.5 rounded-full text-sm hover:bg-white/10 transition-colors">
          Go Home
        </Link>
      </div>
    );
  }

  const isOwner = playlist.ownerId === user?.id;

  return (
    <div className="relative min-h-screen text-white py-12 px-4 md:px-8">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-primary/10 blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] rounded-full bg-accent/10 blur-[100px]" />

      <div className="max-w-6xl mx-auto z-10 relative">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Playlist Header */}
        <div className="flex flex-col md:flex-row gap-8 items-end mb-10">
          <div className="w-48 h-48 md:w-56 md:h-56 rounded-2xl overflow-hidden bg-zinc-800 flex-shrink-0 shadow-2xl border border-white/15">
            <img src={playlist.coverUrl} alt={playlist.title} className="w-full h-full object-cover" />
          </div>

          <div className="flex-1 space-y-3">
            <span className="text-xs uppercase tracking-widest text-accent font-bold flex items-center gap-1.5">
              {isPrivate ? <Lock className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
              {isPrivate ? 'Private' : 'Public'} {isCollaborative ? 'Collaborative' : ''} Playlist
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              {playlist.title}
            </h1>
            <p className="text-zinc-400 text-sm">{playlist.description || 'No description provided.'}</p>
            <p className="text-zinc-300 text-xs font-semibold">
              Created by <span className="text-white">{playlist.owner.username}</span> • {playlist.playlistSongs.length} songs
            </p>
          </div>

          <button 
            onClick={handlePlayPlaylist}
            disabled={playlist.playlistSongs.length === 0}
            className="bg-white text-black font-semibold px-6 py-3 rounded-full hover:scale-105 transition-transform flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Play className="w-4 h-4 fill-black translate-x-0.5" />
            Play Playlist
          </button>
        </div>

        {/* Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* left col: Track list */}
          <div className={`${playlistId === 'favorites' ? 'lg:col-span-3' : 'lg:col-span-2'} glass rounded-2xl p-6`}>
            <h3 className="text-lg font-bold border-b border-white/5 pb-4 mb-4 flex items-center gap-2">
              <Music className="w-5 h-5 text-accent" /> Tracks
            </h3>

            {playlist.playlistSongs.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-sm">
                No songs in this playlist yet. Search for tracks on the homepage and add them!
              </div>
            ) : (
              <div className="space-y-1">
                {playlist.playlistSongs.map((ps: any, index: number) => {
                  const isCurrent = currentTrack?.youtubeId === ps.song.youtubeId;
                  return (
                    <div 
                      key={ps.song.id}
                      className={`flex items-center justify-between p-3 rounded-xl hover:bg-white/5 group transition-colors ${
                        isCurrent ? 'bg-primary/10' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <button 
                          onClick={() => handleTrackPlay(ps.song, index)}
                          className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-primary flex items-center justify-center transition-colors cursor-pointer"
                        >
                          {isCurrent && isPlaying ? (
                            <Pause className="w-3.5 h-3.5 text-white fill-white group-hover:text-white" />
                          ) : (
                            <Play className="w-3.5 h-3.5 text-zinc-400 fill-zinc-400 group-hover:text-white group-hover:fill-white translate-x-0.5" />
                          )}
                        </button>
                        
                        <div className="min-w-0">
                          <p className={`font-semibold text-sm truncate ${isCurrent ? 'text-accent' : 'text-white'}`}>
                            {ps.song.title}
                          </p>
                          <p className="text-zinc-400 text-xs truncate mt-0.5">{ps.song.artistName}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 pl-4">
                        <span className="text-zinc-500 text-xs flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatSongDuration(ps.song.durationSeconds)}
                        </span>
                        
                        {(isOwner || (playlist.isCollaborative && playlist.collaborators.some((c: any) => c.userId === user?.id))) && (
                          <button 
                            onClick={() => handleRemoveTrack(ps.song.id)}
                            className="p-1.5 rounded bg-transparent text-zinc-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                            title="Remove Track"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* right col: Settings & Collaborators */}
          {playlistId !== 'favorites' && (
            <div className="lg:col-span-1 space-y-6">
              
              {/* Playlist settings */}
              {isOwner && (
                <div className="glass rounded-2xl p-6 space-y-4">
                  <h3 className="text-lg font-bold border-b border-white/5 pb-3">Playlist Settings</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">Private Playlist</span>
                      <span className="text-zinc-500 text-[10px]">Only you can view it</span>
                    </div>
                    <input 
                      type="checkbox"
                      checked={isPrivate}
                      onChange={(e) => handleToggleSettings('isPrivate', e.target.checked)}
                      className="accent-primary w-4 h-4 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">Collaborative</span>
                      <span className="text-zinc-500 text-[10px]">Allows friends to add/remove songs</span>
                    </div>
                    <input 
                      type="checkbox"
                      checked={isCollaborative}
                      onChange={(e) => handleToggleSettings('isCollaborative', e.target.checked)}
                      className="accent-primary w-4 h-4 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* Collaborators list */}
              {(isOwner || isCollaborative) && (
                <div className="glass rounded-2xl p-6 space-y-4">
                  <h3 className="text-lg font-bold border-b border-white/5 pb-3 flex items-center gap-2">
                    <Users className="w-5 h-5 text-accent" /> Collaborators
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-xs uppercase text-white">
                        {playlist.owner.username[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{playlist.owner.username}</p>
                        <span className="text-[10px] text-accent font-bold uppercase tracking-wider">Owner</span>
                      </div>
                    </div>

                    {playlist.collaborators.map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center font-bold text-xs uppercase text-white">
                            {c.user.username[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{c.user.username}</p>
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Editor</span>
                          </div>
                        </div>
                        
                        {isOwner && (
                          <button 
                            onClick={() => {
                              if (confirm(`Remove ${c.user.username}?`)) {
                                fetchApi(`/playlists/${playlistId}/collaborators/${c.user.id}`, { method: 'DELETE' })
                                  .then(() => fetchPlaylist());
                              }
                            }}
                            className="text-red-400 hover:text-red-300 text-xs font-semibold cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {isOwner && isCollaborative && (
                    <form onSubmit={handleAddCollaborator} className="border-t border-white/5 pt-4 mt-2">
                      <label className="block text-zinc-400 text-xs mb-2">Add Collaborator by Username</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="username" 
                          required
                          value={collabUsername}
                          onChange={(e) => setCollabUsername(e.target.value)}
                          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs flex-1 focus:outline-none focus:border-primary"
                        />
                        <button 
                          type="submit" 
                          className="bg-primary hover:bg-primary/90 text-white rounded-xl px-3 flex items-center justify-center cursor-pointer"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                      </div>
                      {collabError && <p className="text-red-400 text-[10px] mt-1">{collabError}</p>}
                      {collabSuccess && <p className="text-emerald-400 text-[10px] mt-1">{collabSuccess}</p>}
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
