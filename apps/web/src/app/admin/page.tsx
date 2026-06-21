'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users as UsersIcon, Music as MusicIcon, ListMusic as PlaylistIcon,
  Clock as ClockIcon, ShieldAlert, Trash2, UserCheck, ChevronLeft,
  Search, RefreshCw, Eye, AlertCircle, Sparkles, Activity
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { fetchApi } from '@/lib/api';
import Link from 'next/link';

interface Stats {
  users: number;
  songs: number;
  playlists: number;
  totalListens: number;
  totalListeningDurationSeconds: number;
}

interface UserData {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  role: string;
  createdAt: string;
}

interface SongData {
  id: string;
  youtubeId: string;
  title: string;
  artistName: string;
  thumbnailUrl?: string;
  durationSeconds: number;
  createdAt: string;
}

interface PlaylistData {
  id: string;
  title: string;
  description?: string;
  coverUrl?: string;
  isPrivate: boolean;
  isCollaborative: boolean;
  createdAt: string;
  owner: {
    username: string;
    email: string;
  };
  _count: {
    playlistSongs: number;
  };
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'songs' | 'playlists'>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [songs, setSongs] = useState<SongData[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistData[]>([]);
  
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);

  const [userSearch, setUserSearch] = useState('');
  const [songSearch, setSongSearch] = useState('');
  const [playlistSearch, setPlaylistSearch] = useState('');
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Authenticate and check role
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        window.location.href = '/login';
      } else if (user?.role !== 'ADMIN') {
        window.location.href = '/';
      } else {
        // User is admin, fetch stats
        loadStats();
      }
    }
  }, [authLoading, isAuthenticated, user]);

  // Load stats
  const loadStats = async () => {
    try {
      setLoadingStats(true);
      setErrorMsg(null);
      const data = await fetchApi('/admin/stats');
      setStats(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load system stats');
    } finally {
      setLoadingStats(false);
    }
  };

  // Load detailed lists as needed when tab changes
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') return;

    if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'songs') {
      loadSongs();
    } else if (activeTab === 'playlists') {
      loadPlaylists();
    }
  }, [activeTab, isAuthenticated, user]);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      setErrorMsg(null);
      const data = await fetchApi('/admin/users');
      setUsers(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load user catalog');
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadSongs = async () => {
    try {
      setLoadingSongs(true);
      setErrorMsg(null);
      const data = await fetchApi('/admin/songs');
      setSongs(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load tracks catalog');
    } finally {
      setLoadingSongs(false);
    }
  };

  const loadPlaylists = async () => {
    try {
      setLoadingPlaylists(true);
      setErrorMsg(null);
      const data = await fetchApi('/admin/playlists');
      setPlaylists(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load playlists catalog');
    } finally {
      setLoadingPlaylists(false);
    }
  };

  // Admin Actions
  const handleToggleUserRole = async (targetUserId: string, currentRole: string) => {
    const nextRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      setActionInProgress(targetUserId);
      setErrorMsg(null);
      setSuccessMsg(null);
      await fetchApi(`/admin/users/${targetUserId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: nextRole }),
      });
      setUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, role: nextRole } : u));
      setSuccessMsg(`Successfully changed user's role to ${nextRole}`);
      loadStats(); // Update stats
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update user role');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDeleteUser = async (targetUserId: string) => {
    if (!confirm('Are you absolutely sure you want to delete this user? This will remove all their playlists, likes, comments, and listening history!')) return;
    try {
      setActionInProgress(targetUserId);
      setErrorMsg(null);
      setSuccessMsg(null);
      await fetchApi(`/admin/users/${targetUserId}`, { method: 'DELETE' });
      setUsers(prev => prev.filter(u => u.id !== targetUserId));
      setSuccessMsg('Successfully deleted user and all associated data.');
      loadStats();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete user');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDeleteSong = async (songId: string) => {
    if (!confirm('Are you sure you want to delete this song? It will be removed from all users\' playlists and history.')) return;
    try {
      setActionInProgress(songId);
      setErrorMsg(null);
      setSuccessMsg(null);
      await fetchApi(`/admin/songs/${songId}`, { method: 'DELETE' });
      setSongs(prev => prev.filter(s => s.id !== songId));
      setSuccessMsg('Song successfully deleted from catalog.');
      loadStats();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete song');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    if (!confirm('Are you sure you want to delete this playlist?')) return;
    try {
      setActionInProgress(playlistId);
      setErrorMsg(null);
      setSuccessMsg(null);
      await fetchApi(`/admin/playlists/${playlistId}`, { method: 'DELETE' });
      setPlaylists(prev => prev.filter(p => p.id !== playlistId));
      setSuccessMsg('Playlist deleted successfully.');
      loadStats();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete playlist');
    } finally {
      setActionInProgress(null);
    }
  };

  const formatDuration = (sec: number) => {
    const min = Math.floor(sec / 60);
    const remainingSec = sec % 60;
    return `${min}:${remainingSec.toString().padStart(2, '0')}`;
  };

  const formatListeningTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const min = Math.floor(seconds / 60);
    if (min < 60) return `${min} min`;
    const hrs = Math.floor(min / 60);
    const remMin = min % 60;
    return `${hrs}h ${remMin}m`;
  };

  // Filters based on search
  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredSongs = songs.filter(s => 
    s.title.toLowerCase().includes(songSearch.toLowerCase()) || 
    s.artistName.toLowerCase().includes(songSearch.toLowerCase())
  );

  const filteredPlaylists = playlists.filter(p => 
    p.title.toLowerCase().includes(playlistSearch.toLowerCase()) || 
    p.owner.username.toLowerCase().includes(playlistSearch.toLowerCase())
  );

  // Auth Loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white">
        <RefreshCw className="w-10 h-10 animate-spin text-purple-500 mb-4" />
        <p className="text-zinc-400 font-medium">Validating Admin Credentials...</p>
      </div>
    );
  }

  // Not authorized
  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white p-6">
        <div className="glass-card max-w-md w-full p-8 rounded-3xl text-center flex flex-col items-center border border-red-500/20">
          <ShieldAlert className="w-16 h-16 text-red-500 mb-4 animate-bounce" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
            You do not have administrative permissions to access the Aura Stream Console. If you believe this is an error, please log in with an admin account.
          </p>
          <Link href="/" className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-full font-semibold transition-all shadow-lg hover:shadow-purple-500/20">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070c] text-white flex flex-col pb-12 font-sans selection:bg-purple-500/30">
      {/* Decorative Aura background */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/5 py-4 px-6 lg:px-12 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-all">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
              Aura Console
            </h1>
            <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full font-extrabold border border-purple-500/30">
              Admin
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold">{user.username}</p>
            <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white text-sm shadow-md">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover rounded-full" />
            ) : (
              user.username.substring(0, 2).toUpperCase()
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-8 z-10 flex-1 flex flex-col">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4 mb-8">
          <div className="flex gap-2 p-1 bg-white/5 backdrop-blur-md rounded-xl border border-white/5">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'users', label: 'Users', icon: UsersIcon },
              { id: 'songs', label: 'Songs', icon: MusicIcon },
              { id: 'playlists', label: 'Playlists', icon: PlaylistIcon },
            ].map(tab => {
              const TabIcon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                    active 
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25' 
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Refresh controls */}
          <button 
            onClick={activeTab === 'overview' ? loadStats : activeTab === 'users' ? loadUsers : activeTab === 'songs' ? loadSongs : loadPlaylists} 
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/5 hover:bg-white/5 text-zinc-400 hover:text-white transition-all text-xs font-semibold cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Data
          </button>
        </div>

        {/* Global Notifications */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3"
            >
              <UserCheck className="w-5 h-5 flex-shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Panels */}
        <div className="flex-1">
          {/* Tab 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              {loadingStats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                  {[1, 2, 3, 4].map(n => (
                    <div key={n} className="glass-card rounded-3xl p-6 h-32 bg-zinc-900/40" />
                  ))}
                </div>
              ) : (
                stats && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                  >
                    {/* Stats Card: Users */}
                    <div className="glass-card rounded-3xl p-6 relative overflow-hidden group">
                      <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500 text-purple-400">
                        <UsersIcon className="w-32 h-32" />
                      </div>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400">
                          <UsersIcon className="w-6 h-6" />
                        </div>
                        <h3 className="text-zinc-400 text-sm font-semibold">Total Listeners</h3>
                      </div>
                      <p className="text-3xl font-extrabold tracking-tight">{stats.users}</p>
                      <p className="text-xs text-zinc-500 mt-2">Registered accounts</p>
                    </div>

                    {/* Stats Card: Songs */}
                    <div className="glass-card rounded-3xl p-6 relative overflow-hidden group">
                      <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500 text-pink-400">
                        <MusicIcon className="w-32 h-32" />
                      </div>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 rounded-2xl bg-pink-500/10 text-pink-400">
                          <MusicIcon className="w-6 h-6" />
                        </div>
                        <h3 className="text-zinc-400 text-sm font-semibold">Cached Songs</h3>
                      </div>
                      <p className="text-3xl font-extrabold tracking-tight">{stats.songs}</p>
                      <p className="text-xs text-zinc-500 mt-2">Videos resolved to library</p>
                    </div>

                    {/* Stats Card: Playlists */}
                    <div className="glass-card rounded-3xl p-6 relative overflow-hidden group">
                      <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500 text-indigo-400">
                        <PlaylistIcon className="w-32 h-32" />
                      </div>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
                          <PlaylistIcon className="w-6 h-6" />
                        </div>
                        <h3 className="text-zinc-400 text-sm font-semibold">Playlists</h3>
                      </div>
                      <p className="text-3xl font-extrabold tracking-tight">{stats.playlists}</p>
                      <p className="text-xs text-zinc-500 mt-2">Public & collaborative lists</p>
                    </div>

                    {/* Stats Card: Listening History */}
                    <div className="glass-card rounded-3xl p-6 relative overflow-hidden group">
                      <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500 text-emerald-400">
                        <ClockIcon className="w-32 h-32" />
                      </div>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
                          <ClockIcon className="w-6 h-6" />
                        </div>
                        <h3 className="text-zinc-400 text-sm font-semibold">Total Playtime</h3>
                      </div>
                      <p className="text-3xl font-extrabold tracking-tight">{formatListeningTime(stats.totalListeningDurationSeconds)}</p>
                      <p className="text-xs text-zinc-500 mt-2">Across {stats.totalListens} unique stream logs</p>
                    </div>
                  </motion.div>
                )
              )}

              {/* System status overview */}
              <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-card rounded-3xl p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-400" />
                    System Status
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                      <span className="text-sm font-semibold text-zinc-300">API Server Connection</span>
                      <span className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/25">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Connected (OK)
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                      <span className="text-sm font-semibold text-zinc-300">PostgreSQL (Neon Serverless)</span>
                      <span className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/25">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Live (Scales Active)
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                      <span className="text-sm font-semibold text-zinc-300">YouTube Data API Quota</span>
                      <span className="flex items-center gap-2 text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/25">
                        Active (Caching enabled)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="glass-card rounded-3xl p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold mb-2">Administrator Console</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                      Use the navigation tabs above to audit and moderate users, songs, and playlists. Actions are applied in real-time to the database.
                    </p>
                  </div>
                  <div className="p-4 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-2xl text-xs leading-relaxed">
                    <strong>Notice:</strong> Modifying roles and deleting accounts are destructive actions. Actions logged to database and cannot be undone.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: USERS */}
          {activeTab === 'users' && (
            <div className="glass-card rounded-3xl p-6">
              {/* Table search bar */}
              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/5 rounded-2xl text-sm placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all text-white"
                  />
                </div>
                <div className="text-xs text-zinc-400 font-semibold">
                  Found {filteredUsers.length} users
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                {loadingUsers ? (
                  <div className="py-20 flex flex-col items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-purple-500 animate-spin mb-2" />
                    <p className="text-zinc-400 text-xs">Loading user registry...</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                        <th className="pb-4 pt-2">User</th>
                        <th className="pb-4 pt-2">Email</th>
                        <th className="pb-4 pt-2">Role</th>
                        <th className="pb-4 pt-2">Registered</th>
                        <th className="pb-4 pt-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-zinc-500 text-sm">
                            No users matched your search criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map(u => (
                          <tr key={u.id} className="group hover:bg-white/[0.02] transition-colors text-sm">
                            <td className="py-4 pr-4 flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-xs">
                                {u.avatarUrl ? (
                                  <img src={u.avatarUrl} alt={u.username} className="w-full h-full object-cover rounded-full" />
                                ) : (
                                  u.username.substring(0,2).toUpperCase()
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-white">{u.username}</p>
                                <p className="text-[10px] text-zinc-500 truncate max-w-[150px]">{u.id}</p>
                              </div>
                            </td>
                            <td className="py-4 pr-4 text-zinc-300 font-medium">{u.email}</td>
                            <td className="py-4 pr-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                u.role === 'ADMIN' 
                                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                                  : 'bg-zinc-800/50 text-zinc-400 border-zinc-700/30'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="py-4 pr-4 text-zinc-400 text-xs">
                              {new Date(u.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </td>
                            <td className="py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleToggleUserRole(u.id, u.role)}
                                  disabled={actionInProgress !== null || u.id === user.id}
                                  className={`p-2 rounded-xl border border-white/5 hover:bg-white/5 text-zinc-400 hover:text-white transition-all cursor-pointer ${
                                    u.id === user.id ? 'opacity-30 cursor-not-allowed' : ''
                                  }`}
                                  title="Toggle User Role"
                                >
                                  {actionInProgress === u.id ? (
                                    <RefreshCw className="w-4 h-4 animate-spin text-purple-500" />
                                  ) : (
                                    <UserCheck className="w-4 h-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  disabled={actionInProgress !== null || u.id === user.id}
                                  className={`p-2 rounded-xl border border-red-500/10 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-all cursor-pointer ${
                                    u.id === user.id ? 'opacity-30 cursor-not-allowed' : ''
                                  }`}
                                  title="Delete User"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: SONGS */}
          {activeTab === 'songs' && (
            <div className="glass-card rounded-3xl p-6">
              {/* Table search bar */}
              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search songs by title or artist..."
                    value={songSearch}
                    onChange={e => setSongSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/5 rounded-2xl text-sm placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all text-white"
                  />
                </div>
                <div className="text-xs text-zinc-400 font-semibold">
                  Found {filteredSongs.length} songs cached
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                {loadingSongs ? (
                  <div className="py-20 flex flex-col items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-purple-500 animate-spin mb-2" />
                    <p className="text-zinc-400 text-xs">Loading cached music catalog...</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                        <th className="pb-4 pt-2">Track Details</th>
                        <th className="pb-4 pt-2">YouTube ID</th>
                        <th className="pb-4 pt-2">Duration</th>
                        <th className="pb-4 pt-2">Cached Date</th>
                        <th className="pb-4 pt-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredSongs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-zinc-500 text-sm">
                            No songs cached matching your query.
                          </td>
                        </tr>
                      ) : (
                        filteredSongs.map(s => (
                          <tr key={s.id} className="group hover:bg-white/[0.02] transition-colors text-sm">
                            <td className="py-4 pr-4 flex items-center gap-3">
                              <div className="w-12 h-9 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                                {s.thumbnailUrl ? (
                                  <img src={s.thumbnailUrl} alt={s.title} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-purple-500/10 text-purple-400">
                                    <MusicIcon className="w-4 h-4" />
                                  </div>
                                )}
                              </div>
                              <div className="truncate max-w-[250px] sm:max-w-[400px]">
                                <p className="font-semibold text-white truncate">{s.title}</p>
                                <p className="text-xs text-zinc-400 truncate">{s.artistName}</p>
                              </div>
                            </td>
                            <td className="py-4 pr-4 font-mono text-zinc-400 text-xs">{s.youtubeId}</td>
                            <td className="py-4 pr-4 text-zinc-300 font-semibold">{formatDuration(s.durationSeconds)}</td>
                            <td className="py-4 pr-4 text-zinc-400 text-xs">
                              {new Date(s.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </td>
                            <td className="py-4 text-right">
                              <button
                                onClick={() => handleDeleteSong(s.id)}
                                disabled={actionInProgress !== null}
                                className="p-2 rounded-xl border border-red-500/10 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-all cursor-pointer"
                                title="Delete Song"
                              >
                                {actionInProgress === s.id ? (
                                  <RefreshCw className="w-4 h-4 animate-spin text-purple-500" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Tab 4: PLAYLISTS */}
          {activeTab === 'playlists' && (
            <div className="glass-card rounded-3xl p-6">
              {/* Table search bar */}
              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search playlists by title or owner..."
                    value={playlistSearch}
                    onChange={e => setPlaylistSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/5 rounded-2xl text-sm placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all text-white"
                  />
                </div>
                <div className="text-xs text-zinc-400 font-semibold">
                  Found {filteredPlaylists.length} playlists
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                {loadingPlaylists ? (
                  <div className="py-20 flex flex-col items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-purple-500 animate-spin mb-2" />
                    <p className="text-zinc-400 text-xs">Loading playlists...</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                        <th className="pb-4 pt-2">Playlist</th>
                        <th className="pb-4 pt-2">Created By</th>
                        <th className="pb-4 pt-2">Tracks</th>
                        <th className="pb-4 pt-2">Visibility</th>
                        <th className="pb-4 pt-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredPlaylists.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-zinc-500 text-sm">
                            No playlists found matching your search.
                          </td>
                        </tr>
                      ) : (
                        filteredPlaylists.map(p => (
                          <tr key={p.id} className="group hover:bg-white/[0.02] transition-colors text-sm">
                            <td className="py-4 pr-4 flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                                {p.coverUrl ? (
                                  <img src={p.coverUrl} alt={p.title} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-indigo-500/10 text-indigo-400 font-bold text-sm">
                                    {p.title.substring(0, 1).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div className="truncate max-w-[200px] sm:max-w-[300px]">
                                <p className="font-semibold text-white truncate">{p.title}</p>
                                <p className="text-xs text-zinc-400 truncate">{p.description || 'No description'}</p>
                              </div>
                            </td>
                            <td className="py-4 pr-4">
                              <p className="font-medium text-zinc-300">@{p.owner.username}</p>
                              <p className="text-[10px] text-zinc-500">{p.owner.email}</p>
                            </td>
                            <td className="py-4 pr-4 font-semibold text-zinc-300">{p._count.playlistSongs} songs</td>
                            <td className="py-4 pr-4">
                              <div className="flex gap-2">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  p.isPrivate 
                                    ? 'bg-zinc-800 text-zinc-400 border-zinc-700/30' 
                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                }`}>
                                  {p.isPrivate ? 'Private' : 'Public'}
                                </span>
                                {p.isCollaborative && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                    Collaborative
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 text-right">
                              <button
                                onClick={() => handleDeletePlaylist(p.id)}
                                disabled={actionInProgress !== null}
                                className="p-2 rounded-xl border border-red-500/10 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-all cursor-pointer"
                                title="Delete Playlist"
                              >
                                {actionInProgress === p.id ? (
                                  <RefreshCw className="w-4 h-4 animate-spin text-purple-500" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
