'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Music, Clock, Activity, TrendingUp,
  BarChart2, Eye, ChevronLeft, Search, RefreshCw, Shield,
  Headphones, Radio, Star, ArrowLeft, PlayCircle, Trash2,
  AlertTriangle, Music2, LayoutDashboard, X
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
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ── Mini Bar Chart ──────────────────────────────────────────────────────
function MiniBarChart({ data }: { data: { date: string; seconds: number }[] }) {
  const max = Math.max(...data.map(d => d.seconds), 1);
  const dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((d) => {
        const pct = (d.seconds / max) * 100;
        const dayIdx = new Date(d.date + 'T12:00:00').getDay();
        return (
          <div
            key={d.date}
            className="flex flex-col items-center gap-1 flex-1"
            title={`${d.date}: ${formatDuration(d.seconds)}`}
          >
            <div className="w-full flex-1 flex items-end">
              <div
                className="w-full rounded-t bg-gradient-to-t from-purple-600 to-purple-400 hover:from-purple-500 hover:to-pink-400 transition-all duration-300"
                style={{ height: `${Math.max(pct, pct > 0 ? 8 : 2)}%`, minHeight: 2 }}
              />
            </div>
            <span className="text-[9px] text-zinc-500 font-medium">{dayLabels[dayIdx]}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color }: {
  icon: any; label: string; value: string | number; color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-4 flex items-center gap-3"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-4.5 h-4.5 text-white w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-zinc-400 text-[10px] font-semibold uppercase tracking-wider truncate">{label}</p>
        <p className="text-xl font-bold text-white leading-tight">{value}</p>
      </div>
    </motion.div>
  );
}

// ── Avatar ─────────────────────────────────────────────────────────────
function Avatar({ src, name, size = 'sm' }: { src?: string; name?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'w-16 h-16 text-xl' : size === 'md' ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs';
  const initials = (name || '?').slice(0, 2).toUpperCase();
  return src ? (
    <img src={src} alt={name} className={`${sizeClass} rounded-full object-cover flex-shrink-0`} />
  ) : (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center font-bold text-white flex-shrink-0`}>
      {initials}
    </div>
  );
}

// ── User Insight Modal ─────────────────────────────────────────────────
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#0f0f18] border border-white/10 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-purple-400" /> User Insights
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
            </div>
          )}
          {!loading && !data && (
            <div className="text-center text-zinc-500 py-12">Failed to load insights</div>
          )}

          {data && (
            <>
              {/* User header */}
              <div className="flex items-center gap-4">
                <Avatar src={data.user.avatarUrl} name={data.user.username} size="lg" />
                <div>
                  <h3 className="text-lg font-bold text-white">{data.user.username}</h3>
                  <p className="text-zinc-400 text-sm">{data.user.email}</p>
                  <p className="text-zinc-600 text-xs mt-0.5">
                    Joined {new Date(data.user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Key stats */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Total Time', value: formatDuration(data.totalListeningSeconds), icon: Clock, color: 'text-purple-400' },
                  { label: 'Total Plays', value: data.totalListens, icon: PlayCircle, color: 'text-pink-400' },
                ].map(s => (
                  <div key={s.label} className="bg-white/5 rounded-2xl p-4 text-center">
                    <s.icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
                    <p className="text-2xl font-bold text-white">{s.value}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* 7-day chart */}
              {data.last7Days?.length > 0 && (
                <div className="bg-white/5 rounded-2xl p-4">
                  <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <BarChart2 className="w-3.5 h-3.5" /> Last 7 Days
                  </p>
                  <MiniBarChart data={data.last7Days} />
                  <div className="mt-2 text-center">
                    <p className="text-xs text-zinc-600">
                      This week: {formatDuration(data.last7Days.reduce((s: number, d: any) => s + d.seconds, 0))}
                    </p>
                  </div>
                </div>
              )}

              {/* Top songs */}
              {data.topSongs?.length > 0 && (
                <div>
                  <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5" /> Top Songs
                  </p>
                  <div className="space-y-2">
                    {data.topSongs.slice(0, 5).map((ts: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                        <span className="text-zinc-600 text-xs w-5 text-center font-bold shrink-0">{i + 1}</span>
                        {ts.song?.thumbnailUrl && (
                          <img src={ts.song.thumbnailUrl} className="w-9 h-9 rounded-lg object-cover shrink-0" alt="" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">{ts.song?.title}</p>
                          <p className="text-xs text-zinc-500 truncate">{ts.song?.artistName}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-purple-400 font-bold">{ts.playCount}×</p>
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
                  <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Recent Activity
                  </p>
                  <div className="space-y-1.5 max-h-52 overflow-y-auto">
                    {data.recentActivity.map((a: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors">
                        {a.song?.thumbnailUrl && (
                          <img src={a.song.thumbnailUrl} className="w-8 h-8 rounded-lg object-cover shrink-0" alt="" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white font-medium truncate">{a.song?.title}</p>
                          <p className="text-[10px] text-zinc-500 truncate">{a.song?.artistName}</p>
                        </div>
                        <span className="text-[10px] text-zinc-600 shrink-0">{timeAgo(a.listenedAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.totalListens === 0 && (
                <div className="text-center py-10 text-zinc-600">
                  <Music2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No listening history yet</p>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Delete Confirm Modal ───────────────────────────────────────────────
function DeleteModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onCancel}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#0f0f18] border border-red-500/20 rounded-3xl sm:rounded-2xl p-6 w-full sm:max-w-sm text-center"
      >
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-1">Delete User?</h3>
        <p className="text-zinc-400 text-sm mb-6">This permanently deletes the user and all their data. This cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl bg-white/10 text-white text-sm hover:bg-white/20 transition-colors cursor-pointer font-medium">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm hover:bg-red-400 transition-colors cursor-pointer font-semibold">
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Admin Page ────────────────────────────────────────────────────
type Tab = 'overview' | 'users' | 'activity';

export default function AdminPage() {
  const { user, isLoading, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
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
      setUsers(u || []);
      setActivityFeed(af || []);
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
  }, [isLoading, isAuthenticated, user, loadAll]);

  // Auto-refresh activity every 30s when on activity tab
  useEffect(() => {
    if (activeTab !== 'activity') return;
    const interval = setInterval(() => {
      fetchApi('/admin/activity-feed').then(d => setActivityFeed(d || [])).catch(() => {});
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
    (u.username || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const topListeners = [...users]
    .sort((a, b) => (b.totalListeningSeconds || 0) - (a.totalListeningSeconds || 0))
    .slice(0, 5);

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#07070a] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  // ── Auth guard ──
  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#07070a] flex flex-col items-center justify-center gap-4 text-white px-6 text-center">
        <Shield className="w-16 h-16 text-red-400 opacity-50" />
        <h1 className="text-2xl font-bold">Admin Access Only</h1>
        <p className="text-zinc-500 text-sm">This page is restricted to administrators.</p>
        <Link href="/" className="mt-2 px-6 py-3 bg-purple-600 rounded-2xl text-sm font-semibold hover:bg-purple-500 transition-colors">
          Go back home
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: 'overview' as Tab, label: 'Overview', icon: LayoutDashboard },
    { id: 'users' as Tab, label: 'Users', icon: Users },
    { id: 'activity' as Tab, label: 'Activity', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-[#07070a] text-white pb-24 sm:pb-8">
      {/* ── Header ── */}
      <div className="sticky top-0 z-30 bg-[#07070a]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link href="/" className="p-2 rounded-xl hover:bg-white/10 transition-colors">
              <ChevronLeft className="w-5 h-5 text-zinc-400" />
            </Link>
            <div>
              <h1 className="text-base font-bold text-white flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-purple-400" />
                Admin Dashboard
              </h1>
              <p className="text-[10px] text-zinc-500">{user.username} · Admin</p>
            </div>
          </div>
          <button
            onClick={loadAll}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-zinc-400 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Desktop tabs */}
        <div className="max-w-4xl mx-auto px-4 hidden sm:flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'users' && users.length > 0 && (
                <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full leading-none">
                  {users.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass-card rounded-2xl p-4 h-20 animate-pulse" />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">

            {/* ══ OVERVIEW ══ */}
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                {/* Stat grid */}
                <div className="grid grid-cols-2 gap-3">
                  <StatCard icon={Users} label="Total Users" value={stats?.users ?? 0} color="bg-purple-600" />
                  <StatCard icon={Music} label="Songs" value={stats?.songs ?? 0} color="bg-pink-600" />
                  <StatCard icon={Headphones} label="Total Plays" value={stats?.totalListens ?? 0} color="bg-blue-600" />
                  <StatCard icon={Clock} label="Listen Time" value={formatDuration(stats?.totalListeningDurationSeconds ?? 0)} color="bg-emerald-600" />
                </div>

                {/* Top listeners */}
                <div className="glass-card rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/5">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-purple-400" /> Top Listeners
                    </h3>
                  </div>
                  <div className="p-3 space-y-1">
                    {topListeners.length === 0 && (
                      <p className="text-zinc-600 text-sm text-center py-6">No listening data yet</p>
                    )}
                    {topListeners.map((u, i) => (
                      <button
                        key={u.id}
                        onClick={() => setSelectedUserId(u.id)}
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors text-left cursor-pointer"
                      >
                        <span className="text-zinc-600 text-xs font-bold w-4 text-center">#{i + 1}</span>
                        <Avatar src={u.avatarUrl} name={u.username} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{u.username}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                                style={{
                                  width: `${((u.totalListeningSeconds || 0) / Math.max(topListeners[0]?.totalListeningSeconds || 1, 1)) * 100}%`
                                }}
                              />
                            </div>
                            <span className="text-[10px] text-zinc-500 shrink-0">{formatDuration(u.totalListeningSeconds)}</span>
                          </div>
                        </div>
                        <Eye className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* What's playing now */}
                <div className="glass-card rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Radio className="w-4 h-4 text-pink-400" /> What's Playing Now
                    </h3>
                    <span className="flex items-center gap-1.5 text-[10px] text-green-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Live
                    </span>
                  </div>
                  <div className="divide-y divide-white/5 max-h-64 overflow-y-auto">
                    {activityFeed.slice(0, 10).map((a, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                        {a.song?.thumbnailUrl && (
                          <img src={a.song.thumbnailUrl} className="w-9 h-9 rounded-lg object-cover shrink-0" alt="" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white font-medium truncate">{a.song?.title}</p>
                          <p className="text-[10px] text-zinc-500 truncate">
                            @{a.user?.username} · {a.song?.artistName}
                          </p>
                        </div>
                        <span className="text-[10px] text-zinc-600 shrink-0">{timeAgo(a.listenedAt)}</span>
                      </div>
                    ))}
                    {activityFeed.length === 0 && (
                      <div className="text-center text-zinc-600 py-8 text-sm">No recent activity</div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══ USERS ══ */}
            {activeTab === 'users' && (
              <motion.div key="users" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search users…"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 pl-10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 transition-colors"
                  />
                </div>

                {/* User list */}
                <div className="glass-card rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/5">
                    <p className="text-sm font-semibold text-zinc-400">{filteredUsers.length} users</p>
                  </div>
                  <div className="divide-y divide-white/5">
                    {filteredUsers.map(u => (
                      <div key={u.id} className="px-4 py-3 hover:bg-white/[0.03] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar src={u.avatarUrl} name={u.username} />
                            {u.role === 'ADMIN' && (
                              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-yellow-500 rounded-full flex items-center justify-center">
                                <Shield className="w-2 h-2 text-white" />
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-sm font-semibold text-white truncate">{u.username}</p>
                              {u.role === 'ADMIN' && (
                                <span className="text-[9px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded font-bold shrink-0">ADMIN</span>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-500 truncate">{u.email}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => setSelectedUserId(u.id)}
                              className="p-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/30 text-purple-400 transition-colors cursor-pointer"
                              title="View insights"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {u.role !== 'ADMIN' && (
                              <button
                                onClick={() => setDeleteConfirm(u.id)}
                                className="p-2 rounded-xl bg-red-500/15 hover:bg-red-500/30 text-red-400 transition-colors cursor-pointer"
                                title="Delete user"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Stats row */}
                        <div className="mt-2 flex items-center gap-4 flex-wrap">
                          <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                            <Clock className="w-3 h-3" /> {formatDuration(u.totalListeningSeconds)}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                            <PlayCircle className="w-3 h-3" /> {u.totalListens} plays
                          </span>
                          {u.lastActiveAt && (
                            <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                              <Activity className="w-3 h-3" /> {timeAgo(u.lastActiveAt)}
                            </span>
                          )}
                        </div>

                        {/* Last song */}
                        {u.lastSong && (
                          <div className="mt-2 flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
                            {u.lastSong.thumbnailUrl && (
                              <img src={u.lastSong.thumbnailUrl} className="w-7 h-7 rounded object-cover shrink-0" alt="" />
                            )}
                            <div className="min-w-0">
                              <p className="text-[10px] text-zinc-400 truncate">Last played: {u.lastSong.title}</p>
                              <p className="text-[10px] text-zinc-600 truncate">{u.lastSong.artistName}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {filteredUsers.length === 0 && (
                      <div className="text-center text-zinc-600 py-12 text-sm">No users found</div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══ ACTIVITY ══ */}
            {activeTab === 'activity' && (
              <motion.div key="activity" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-green-400" /> Live Activity
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  </h2>
                  <span className="text-[10px] text-zinc-600">Refreshes every 30s</span>
                </div>

                <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/5">
                  {activityFeed.map((a, i) => (
                    <div key={i} className="px-4 py-3 hover:bg-white/[0.03] transition-colors">
                      {/* Mobile: stack layout */}
                      <div className="flex items-center gap-3">
                        {a.song?.thumbnailUrl && (
                          <img src={a.song.thumbnailUrl} className="w-11 h-11 rounded-xl object-cover shrink-0" alt="" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">{a.song?.title}</p>
                          <p className="text-xs text-zinc-500 truncate">{a.song?.artistName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Avatar src={a.user?.avatarUrl} name={a.user?.username} size="sm" />
                            <p className="text-[10px] text-zinc-500">@{a.user?.username}</p>
                            <span className="text-[10px] text-zinc-600 ml-auto">{timeAgo(a.listenedAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {activityFeed.length === 0 && (
                    <div className="text-center text-zinc-600 py-16">
                      <Activity className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No activity yet</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        )}
      </div>

      {/* ── Mobile Bottom Tab Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 sm:hidden bg-[#0a0a12]/95 backdrop-blur-xl border-t border-white/10">
        <div className="flex items-center justify-around px-2 py-2 safe-b">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-colors cursor-pointer min-w-0 ${
                activeTab === tab.id ? 'text-purple-400' : 'text-zinc-600'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div layoutId="tab-indicator" className="w-1 h-1 rounded-full bg-purple-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {selectedUserId && (
          <UserInsightModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {deleteConfirm && (
          <DeleteModal
            onCancel={() => setDeleteConfirm(null)}
            onConfirm={() => handleDeleteUser(deleteConfirm)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
