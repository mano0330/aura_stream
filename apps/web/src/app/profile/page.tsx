'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Music, User, Edit3, ArrowLeft, Loader2, Save, 
  ListMusic, Users, CheckCircle
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading, updateUser } = useAuthStore();
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [stats, setStats] = useState({ playlists: 0, followers: 0, following: 0 });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/login';
    }
  }, [isLoading, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && user) {
      setUsername(user.username || '');
      setBio(user.bio || '');
      setAvatarUrl(user.avatarUrl || '');
      
      // Fetch fresh profile details from API to load stats
      fetchProfileDetails();
    }
  }, [isAuthenticated, user]);

  const fetchProfileDetails = async () => {
    try {
      const data = await fetchApi('/users/me', {
        method: 'GET',
      });
      setStats({
        playlists: data._count?.playlists || 0,
        followers: data._count?.followers || 0,
        following: data._count?.following || 0,
      });
    } catch (err) {
      console.error("Could not fetch user stats:", err);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError('');

    try {
      const data = await fetchApi('/users/me/update', {
        method: 'PUT',
        body: JSON.stringify({ username, bio, avatarUrl }),
      });
      
      updateUser(data.user);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Profile update failed.');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-white px-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-white py-12 px-4 md:px-8">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-primary/10 blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] rounded-full bg-accent/10 blur-[100px]" />

      <div className="max-w-4xl mx-auto z-10 relative">
        {/* Back Link */}
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Profile Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* left col: Profile Summary & Stats */}
          <div className="md:col-span-1 glass-card rounded-2xl p-6 flex flex-col items-center text-center h-fit">
            <div className="relative w-32 h-32 rounded-full overflow-hidden mb-4 border-2 border-primary/40 bg-zinc-800">
              <img 
                src={avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80"} 
                alt={user?.username} 
                className="w-full h-full object-cover" 
              />
            </div>
            
            <h2 className="text-xl font-bold">{user?.username}</h2>
            <p className="text-zinc-500 text-xs mt-1">Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'recently'}</p>
            
            {user?.bio && (
              <p className="text-zinc-300 text-sm mt-4 italic leading-relaxed">
                &quot;{user.bio}&quot;
              </p>
            )}

            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4 w-full border-t border-white/5 mt-6 pt-6">
              <div className="flex flex-col items-center">
                <ListMusic className="w-4 h-4 text-accent mb-1" />
                <span className="text-sm font-bold">{stats.playlists}</span>
                <span className="text-zinc-500 text-[10px] uppercase tracking-wider">Playlists</span>
              </div>
              <div className="flex flex-col items-center">
                <Users className="w-4 h-4 text-accent mb-1" />
                <span className="text-sm font-bold">{stats.followers}</span>
                <span className="text-zinc-500 text-[10px] uppercase tracking-wider">Followers</span>
              </div>
              <div className="flex flex-col items-center">
                <Users className="w-4 h-4 text-accent mb-1" />
                <span className="text-sm font-bold">{stats.following}</span>
                <span className="text-zinc-500 text-[10px] uppercase tracking-wider">Following</span>
              </div>
            </div>
          </div>

          {/* right col: Profile Settings Form */}
          <div className="md:col-span-2 glass-card rounded-2xl p-8">
            <h3 className="text-lg font-bold flex items-center gap-2 border-b border-white/5 pb-4 mb-6">
              <Edit3 className="w-5 h-5 text-accent" />
              Edit Profile Settings
            </h3>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg p-3 mb-6">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-lg p-3 mb-6 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Profile updated successfully!
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-6">
              <div>
                <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-zinc-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  Avatar Image URL
                </label>
                <input
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-zinc-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  Bio / Description
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share a bit about your musical taste..."
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-zinc-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="royal-gradient text-white font-semibold px-6 py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/25 transition-all cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed ml-auto"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Settings
                  </>
                )}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
