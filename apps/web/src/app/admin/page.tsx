'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Music, ListMusic, Clock, Activity, TrendingUp,
  BarChart2, Eye, ChevronLeft, Search, RefreshCw, Shield,
  Headphones, Radio, Star, ArrowLeft, Zap, Globe, Calendar,
  PlayCircle, UserCheck, Trash2, ChevronRight, AlertTriangle,
  Music2, Hash
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { fetchApi } from '@/lib/api';
import Link from 'next/link';

// ── Helpers ────────────────────────────────────────────────────────────
function formatDuration(seconds: number): string {
  if (!seconds) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// Mini bar chart for 7-day listening
function MiniBarChart({ data }: { data: { date: string; seconds: number }[] }) {
  const max = Math.max(...data.map(d => d.seconds), 1);
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="flex items-end gap-1 h-12">
      {data.map((d, i) => {
        const pct = (d.seconds / max) * 100;
        const dayIdx = new Date(d.date).getDay();
        return (
          <div key={d.date} className="flex flex-col items-center gap-0.5 flex-1" title={`${d.date}: ${formatDuration(d.seconds)}`}>
            <div
              className="w-full rounded-t bg-purple-500/70 hover:bg-purple-400 transition-all"
              style={{ height: `${Math.max(pct, 2)}%`, minHeight: pct > 0 ? 3 : 1 }}
            />
            <span className="text-[8px] text-zinc-500">{days[dayIdx]}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-5 flex items-start gap-4"
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
        {sub && <p className="text-zinc-500 text-xs mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

// ── User Row ──────────────────────────────────────────────────────────
function UserRow({ u, onView, onDelete }: { u: any; onView: () => void; onDelete: () => void }) {
  const initials = u.username?.slice(0, 2).toUpperCase() || 'U?';
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group">
      <div className="relative flex-shrink-0">
        {u.avatarUrl ? (
          <img src={u.avatarUrl} alt={u.username} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-purple-600/30 flex items-center justify-center text-purple-300 font-bold text-sm">
            {initials}
          </div>
        )}
        {u.role === 'ADMIN' && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
            <Shield className="w-2.5 h-2.5 text-white" />
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-white truncate">{u.username}</p>
          {u.role === 'ADMIN' && <span className="text-[9px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded font-bold">ADMIN</span>}
        </div>
        <p className="text-xs text-zinc-500 truncate">{u.email}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-[10px] text-zinc-500 flex items-center gap-0.5">
            <Headphones className="w-2.5 h-2.5" />
            {formatDuration(u.totalListeningSeconds)}
          </span>
          <span className="text-[10px] text-zinc-500 flex items-center gap-0.5">
            <PlayCircle className="w-2.5 h-2.5" />
            {u.totalListens} plays
          </span>
          {u.lastActiveAt && (
            <span className="text-[10px] text-zinc-500 flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />
              {timeAgo(u.lastActiveAt)}
            </span>
          )}
        </div>
      </div>
      {u.lastSong && (
        <div className="hidden md:flex items-center gap-2 flex-shrink-0 max-w-[180px]">
          {u.lastSong.thumbnailUrl && (
            <img src={u.lastSong.thumbnailUrl} className="w-8 h-8 rounded object-cover" alt="" />
          )}
          <div className="min-w-0">
            <p className="text-[10px] text-zinc-400 truncate">{u.lastSong.title}</p>
            <p className="text-[10px] text-zinc-600 truncate">{u.lastSong.artistName}</p>
          </div>
        </div>
      )}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onView}
          className="p-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/40 text-purple-400 transition-colors cursor-pointer"
          title="View insights"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
        {u.role !== 'ADMIN' && (
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-colors cursor-pointer"
            title="Delete user"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── User Insight Modal ────────────────────────────────────────────────
function UserInsightModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi(`/admin/users/${userId}/insights`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#0f0f18] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#0f0f18] z-10">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer">
              <ArrowLeft className="w-4 h-4 text-zinc-400" />
            </button>
            <h2 className="text-lg font-bold text-white">User Insights</h2>
          </div>
          <span className="text-xs text-zinc-500 bg-white/5 px-3 py-1 rounded-full">Admin Only</span>
        </div>

        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
            </div>
          )}
          {!loading && !data && (
            <div className="text-center text-zinc-500 py-12">Failed to load insights</div>
          )}
          {data && (
            <div className="space-y-6">
              {/* User header */}
              <div className="flex items-center gap-4">
                {data.user.avatarUrl ? (
                  <img src={data.user.avatarUrl} className="w-16 h-16 rounded-2xl object-cover" alt="" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-purple-600/30 flex items-center justify-center text-2xl font-bold text-purple-300">
                    {data.user.username?.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-white">{data.user.username}</h3>
                  <p className="text-zinc-400 text-sm">{data.user.email}</p>
                  <p className="text-zinc-600 text-xs mt-0.5">Joined {new Date(data.user.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-zinc-400 text-xs uppercase tracking-wider">Total Time</p>
                  <p className="text-2xl font-bold text-white mt-1">{formatDuration(data.totalListeningSeconds)}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-zinc-400 text-xs uppercase tracking-wider">Total Plays</p>
                  <p className="text-2xl font-bold text-white mt-1">{data.totalListens}</p>
                </div>
              </div>

              {/* 7-day chart */}
              {data.last7Days?.length > 0 && (
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-zinc-400 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <BarChart2 className="w-3.5 h-3.5" /> Last 7 Days Listening
                  </p>
                  <MiniBarChart data={data.last7Days} />
                </div>
              )}

              {/* Top songs */}
              {data.topSongs?.length > 0 && (
                <div>
                  <p className="text-zinc-400 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5" /> Top Songs
                  </p>
                  <div className="space-y-2">
                    {data.topSongs.slice(0, 5).map((ts: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                        <span className="text-zinc-600 text-xs w-4 text-right font-bold">{i + 1}</span>
                        {ts.song?.thumbnailUrl && (
                          <img src={ts.song.thumbnailUrl} className="w-9 h-9 rounded-lg object-cover" alt="" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">{ts.song?.title}</p>
                          <p className="text-xs text-zinc-500 truncate">{ts.song?.artistName}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-purple-400 font-bold">{ts.playCount}x</p>
                          <p className="text-[10px] text-zinc-600">{formatDuration(ts.totalSeconds)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent activity */}
              {data.recentActivity?.length > 0 && (
                <div>
                  <p className="text-zinc-400 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Recent Activity
                  </p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {data.recentActivity.map((a: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5">
                        {a.song?.thumbnailUrl && (
                          <img src={a.song.thumbnailUrl} className="w-7 h-7 rounded object-cover" alt="" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white truncate">{a.song?.title}</p>
                          <p className="text-[10px] text-zinc-500">{a.song?.artistName}</p>
                        </div>
                        <span className="text-[10px] text-zinc-600 flex-shrink-0">{timeAgo(a.listenedAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.totalListens === 0 && (
                <div className="text-center py-8 text-zinc-600">
                  <Music2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>No listening history yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Admin Page ───────────────────────────────────────────────────
export default function AdminPage() {
  const { user, isLoading, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'activity'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = useCallback(async () => {
    setRefreshing(true);
    try {
      const [s, u, af] = await Promise.all([
        fetchApi('/admin/stats'),
        fetchApi('/admin/users-insights'),
        fetchApi('/admin/activity-feed'),
      ]);
      setStats(s);
      setUsers(u);
      setActivityFeed(af);
    } catch (e) {
      console.error('Admin load error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role === 'ADMIN') {
      loadAll();
    }
  }, [isLoading, isAuthenticated, user]);

  // Auto-refresh activity feed every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'activity') {
        fetchApi('/admin/activity-feed').then(setActivityFeed).catch(() => {});
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleDeleteUser = async (userId: string) => {
    try {
      await fetchApi(`/admin/users/${userId}`, { method: 'DELETE' });
      setUsers(prev => prev.filter(u => u.id !== userId));
      setDeleteConfirm(null);
    } catch (e: any) {
      alert(e.message || 'Delete failed');
    }
  };

  const filteredUsers = users.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  // Top listeners by time
  const topListeners = [...users]
    .sort((a, b) => (b.totalListeningSeconds || 0) - (a.totalListeningSeconds || 0))
    .slice(0, 5);

  // Guard
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#07070a] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }
  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#07070a] flex flex-col items-center justify-center gap-4 text-white">
        <Shield className="w-16 h-16 text-red-400 opacity-50" />
        <h1 className="text-2xl font-bold">Admin Access Only</h1>
        <Link href="/" className="text-purple-400 hover:underline text-sm">Go back home</Link>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'activity', label: 'Live Activity', icon: Activity },
  ] as const;

  return (
    <div className="min-h-screen bg-[#07070a] text-white">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#07070a]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 rounded-xl hover:bg-white/10 transition-colors">
              <ChevronLeft className="w-5 h-5 text-zinc-400" />
            </Link>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" /> Admin Dashboard
              </h1>
              <p className="text-xs text-zinc-500">Logged in as {user.username}</p>
            </div>
          </div>
          <button
            onClick={loadAll}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm text-zinc-400 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-4 pb-0 flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'users' && users.length > 0 && (
                <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full">{users.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card rounded-2xl p-5 h-24 animate-pulse bg-white/5" />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* ── OVERVIEW TAB ── */}
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard icon={Users} label="Total Users" value={stats?.users ?? 0} color="bg-purple-600" />
                  <StatCard icon={Music} label="Songs Cached" value={stats?.songs ?? 0} color="bg-pink-600" />
                  <StatCard icon={Headphones} label="Total Plays" value={stats?.totalListens ?? 0} color="bg-blue-600" />
                  <StatCard
                    icon={Clock}
                    label="Total Listen Time"
                    value={formatDuration(stats?.totalListeningDurationSeconds ?? 0)}
                    color="bg-emerald-600"
                  />
                </div>

                {/* Top Listeners */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="glass-card rounded-2xl p-5">
                    <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-purple-400" /> Top Listeners
                    </h3>
                    <div className="space-y-3">
                      {topListeners.map((u, i) => (
                        <div key={u.id} className="flex items-center gap-3 cursor-pointer hover:bg-white/5 rounded-xl p-2 transition-colors" onClick={() => setSelectedUserId(u.id)}>
                          <span className="text-zinc-600 text-sm font-bold w-5 text-center">#{i + 1}</span>
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} className="w-8 h-8 rounded-full object-cover" alt="" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-purple-600/30 flex items-center justify-center text-xs font-bold text-purple-300">
                              {u.username?.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{u.username}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                                  style={{ width: `${((u.totalListeningSeconds || 0) / (topListeners[0]?.totalListeningSeconds || 1)) * 100}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-zinc-500 flex-shrink-0">{formatDuration(u.totalListeningSeconds)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {topListeners.length === 0 && <p className="text-zinc-600 text-sm text-center py-4">No listening data yet</p>}
                    </div>
                  </div>

                  {/* Recent global activity */}
                  <div className="glass-card rounded-2xl p-5">
                    <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
                      <Radio className="w-4 h-4 text-pink-400" /> What's Playing Now
                    </h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {activityFeed.slice(0, 8).map((a, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
                          {a.song?.thumbnailUrl && (
                            <img src={a.song.thumbnailUrl} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" alt="" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white font-medium truncate">{a.song?.title}</p>
                            <p className="text-[10px] text-zinc-500 truncate">{a.user?.username} · {a.song?.artistName}</p>
                          </div>
                          <span className="text-[10px] text-zinc-600 flex-shrink-0">{timeAgo(a.listenedAt)}</span>
                        </div>
                      ))}
                      {activityFeed.length === 0 && <p className="text-zinc-600 text-sm text-center py-8">No recent activity</p>}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── USERS TAB ── */}
            {activeTab === 'users' && (
              <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search users by name or email…"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pl-9 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50"
                  />
                </div>

                {/* User list */}
                <div className="glass-card rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-400" />
                      {filteredUsers.length} Users
                    </h2>
                    <span className="text-xs text-zinc-600">Click 👁 to view insights</span>
                  </div>
                  <div className="p-2 divide-y divide-white/5">
                    {filteredUsers.map(u => (
                      <UserRow
                        key={u.id}
                        u={u}
                        onView={() => setSelectedUserId(u.id)}
                        onDelete={() => setDeleteConfirm(u.id)}
                      />
                    ))}
                    {filteredUsers.length === 0 && (
                      <div className="text-center text-zinc-600 py-10">No users found</div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── ACTIVITY TAB ── */}
            {activeTab === 'activity' && (
              <motion.div key="activity" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-green-400" />
                    Global Listening Activity
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  </h2>
                  <span className="text-xs text-zinc-600">Auto-refreshes every 30s</span>
                </div>

                <div className="glass-card rounded-2xl overflow-hidden">
                  <div className="divide-y divide-white/5">
                    {activityFeed.map((a, i) => (
                      <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-white/5 transition-colors">
                        {/* User */}
                        <div className="flex items-center gap-2 w-36 flex-shrink-0">
                          {a.user?.avatarUrl ? (
                            <img src={a.user.avatarUrl} className="w-7 h-7 rounded-full object-cover" alt="" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-purple-600/30 flex items-center justify-center text-[10px] font-bold text-purple-300">
                              {a.user?.username?.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs text-white font-medium truncate">{a.user?.username}</p>
                            <p className="text-[9px] text-zinc-600 truncate">{a.user?.email}</p>
                          </div>
                        </div>

                        {/* Arrow */}
                        <Headphones className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />

                        {/* Song */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {a.song?.thumbnailUrl && (
                            <img src={a.song.thumbnailUrl} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" alt="" />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm text-white font-medium truncate">{a.song?.title}</p>
                            <p className="text-xs text-zinc-500 truncate">{a.song?.artistName}</p>
                          </div>
                        </div>

                        {/* Time */}
                        <div className="text-right flex-shrink-0">
                          <span className="text-[10px] text-zinc-600">{timeAgo(a.listenedAt)}</span>
                        </div>
                      </div>
                    ))}
                    {activityFeed.length === 0 && (
                      <div className="text-center text-zinc-600 py-16">
                        <Activity className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p>No activity yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* User Insight Modal */}
      <AnimatePresence>
        {selectedUserId && (
          <UserInsightModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
        )}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f0f18] border border-red-500/20 rounded-2xl p-6 w-full max-w-sm text-center"
            >
              <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-2">Delete User?</h3>
              <p className="text-zinc-400 text-sm mb-5">This will permanently delete the user and all their data.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 text-white text-sm hover:bg-white/20 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteUser(deleteConfirm)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm hover:bg-red-400 transition-colors cursor-pointer font-semibold"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
