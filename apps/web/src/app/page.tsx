'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, SkipForward, SkipBack, Volume2, Search,
  Heart, ListMusic, Radio, Users, Settings, User as UserIcon,
  LogOut, Compass, Sparkles, MessageSquare, Flame, Bell, Moon, Sun,
  Tv, VolumeX, PlusCircle, X, Check, Eye, Loader2, Shuffle, Repeat,
  Zap, Music2, TrendingUp, ChevronRight, Send, Bot, UserCheck,
  UserPlus as UserPlusIcon, Activity, Clock, Globe, Smartphone
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { usePlayerStore, Track } from '@/store/playerStore';
import { fetchApi } from '@/lib/api';
import Link from 'next/link';
import NowPlayingScreen from '@/components/NowPlayingScreen';

// ── Seeded catalog for rich home page visuals ──────────────────────────
// Helper: get best-quality YouTube thumbnail
function hqThumb(youtubeId: string): string {
  return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
}

const MOCK_TRENDING: Track[] = [
  { id: '1', title: 'Cornfield Chase', artistName: 'Hans Zimmer', durationSeconds: 126, thumbnailUrl: hqThumb('1FzVWlOKnCc'), youtubeId: '1FzVWlOKnCc' },
  { id: '2', title: 'Get Lucky (feat. Pharrell)', artistName: 'Daft Punk', durationSeconds: 248, thumbnailUrl: hqThumb('5NV6Rdv1a3I'), youtubeId: '5NV6Rdv1a3I' },
  { id: '3', title: 'Starboy', artistName: 'The Weeknd', durationSeconds: 230, thumbnailUrl: hqThumb('34Na4j8AVgA'), youtubeId: '34Na4j8AVgA' },
  { id: '4', title: 'Intro', artistName: 'The xx', durationSeconds: 128, thumbnailUrl: hqThumb('hhnZ5115rn4'), youtubeId: 'hhnZ5115rn4' },
];

const MOCK_MIXES = [
  { id: 'mix1', title: 'Daily Mix 1', description: 'Hans Zimmer, Max Richter, Olafur Arnalds', color: 'from-primary/30 to-accent/15', icon: '🎹' },
  { id: 'mix2', title: 'AI DJ Focus', description: 'Lofi beats and instrumental synthwave for coding', color: 'from-accent/15 to-primary/30', icon: '🤖' },
  { id: 'mix3', title: 'Aura Workout', description: 'Upbeat electronic, house, high-tempo remixes', color: 'from-emerald-600/30 to-teal-600/30', icon: '⚡' },
];

const DISCOVER_MOODS = [
  { label: 'Lofi & Chill', query: 'lofi hip hop relaxing', emoji: '☕', color: 'from-amber-500/20 to-orange-600/20' },
  { label: 'Focus & Code', query: 'ambient coding music instrumental', emoji: '💻', color: 'from-blue-500/20 to-indigo-600/20' },
  { label: 'Workout', query: 'gym workout motivation high energy', emoji: '🏋️', color: 'from-red-500/20 to-pink-600/20' },
  { label: 'Party', query: 'dance party hits 2024', emoji: '🎉', color: 'from-primary/20 to-accent/20' },
  { label: 'Telugu Hits', query: 'telugu hits top songs', emoji: '🎵', color: 'from-orange-500/20 to-yellow-600/20' },
  { label: 'Tamil Hits', query: 'tamil hits top songs', emoji: '🎻', color: 'from-emerald-500/20 to-green-600/20' },
  { label: 'Hindi Hits', query: 'hindi hits top songs', emoji: '💃', color: 'from-red-500/20 to-pink-600/20' },
  { label: 'Trending India', query: 'trending bollywood songs 2024', emoji: '🎶', color: 'from-orange-500/20 to-red-600/20' },
  { label: 'K-Pop', query: 'kpop popular hits BTS BLACKPINK', emoji: '✨', color: 'from-pink-500/20 to-rose-600/20' },
  { label: 'Cinematic', query: 'cinematic epic orchestral film score', emoji: '🎬', color: 'from-slate-500/20 to-gray-700/20' },
];

function formatTrackTime(seconds: number): string {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ── Track Card Component ──────────────────────────────────────────────
function TrackCard({
  track,
  isCurrent,
  isPlaying,
  isLiked,
  isAuthenticated,
  onPlay,
  onLike,
  onAddToPlaylist,
}: {
  track: Track;
  isCurrent: boolean;
  isPlaying: boolean;
  isLiked: boolean;
  isAuthenticated: boolean;
  onPlay: () => void;
  onLike: (e: React.MouseEvent) => void;
  onAddToPlaylist: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      onClick={onPlay}
      className={`glass-card rounded-2xl p-4 flex flex-col cursor-pointer group ${isCurrent ? 'border-primary/50 shadow-lg shadow-primary/10' : ''}`}
    >
      <div className="relative aspect-square rounded-xl overflow-hidden mb-4 bg-zinc-800">
        <img src={track.thumbnailUrl} alt={track.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-between p-3 transition-opacity duration-300">
          {isAuthenticated && (
            <button onClick={onLike} className={`p-2 rounded-full backdrop-blur-md bg-black/40 transition-all cursor-pointer ${isLiked ? 'text-accent' : 'text-zinc-300 hover:text-white'}`}>
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-accent' : ''}`} />
            </button>
          )}
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all mx-auto">
            {isCurrent && isPlaying ? <Pause className="w-5 h-5 text-white fill-white" /> : <Play className="w-5 h-5 text-white fill-white translate-x-0.5" />}
          </div>
          {isAuthenticated && (
            <button onClick={onAddToPlaylist} className="p-2 rounded-full backdrop-blur-md bg-black/40 text-zinc-300 hover:text-white transition-all cursor-pointer">
              <PlusCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <h4 className={`font-bold truncate text-sm ${isCurrent ? 'text-accent' : ''}`}>{track.title}</h4>
      <p className="text-zinc-400 text-xs truncate mt-1">{track.artistName}</p>
    </div>
  );
}

// ── Track Row Component ───────────────────────────────────────────────
function TrackRow({
  track,
  index,
  isCurrent,
  isPlaying,
  isLiked,
  isAuthenticated,
  onPlay,
  onLike,
  onAddToPlaylist,
}: {
  track: Track;
  index?: number;
  isCurrent: boolean;
  isPlaying: boolean;
  isLiked: boolean;
  isAuthenticated: boolean;
  onPlay: () => void;
  onLike: (e: React.MouseEvent) => void;
  onAddToPlaylist: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      onClick={onPlay}
      className={`flex items-center justify-between p-3 rounded-xl hover:bg-white/5 cursor-pointer group transition-colors ${isCurrent ? 'bg-primary/10' : ''}`}
    >
      <div className="flex items-center gap-4 min-w-0 flex-1">
        {index !== undefined && (
          <span className="text-zinc-500 text-xs w-4 text-right font-mono">{index + 1}</span>
        )}
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0 relative">
          <img src={track.thumbnailUrl} alt={track.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {isCurrent && isPlaying ? <Pause className="w-4 h-4 text-white fill-white" /> : <Play className="w-4 h-4 text-white fill-white translate-x-0.5" />}
          </div>
        </div>
        <div className="min-w-0">
          <p className={`font-semibold text-sm truncate ${isCurrent ? 'text-accent' : 'text-white'}`}>{track.title}</p>
          <p className="text-zinc-400 text-xs truncate mt-0.5">{track.artistName}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 pl-4">
        {isAuthenticated && (
          <>
            <button onClick={(e) => { e.stopPropagation(); onAddToPlaylist(e); }} className="p-2 rounded hover:bg-white/5 text-zinc-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
              <PlusCircle className="w-4 h-4" />
            </button>
            <button onClick={onLike} className={`p-2 rounded hover:bg-white/5 transition-colors ${isLiked ? 'text-accent' : 'text-zinc-400 hover:text-white'}`}>
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-accent' : ''}`} />
            </button>
          </>
        )}
        <span className="text-zinc-500 text-xs w-10 text-right">{formatTrackTime(track.durationSeconds)}</span>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD PAGE
// ══════════════════════════════════════════════════════════════════════
export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, isLoading } = useAuthStore();

  const { theme, toggleTheme, isSidebarOpen, toggleSidebar } = useUiStore();

  const {
    currentTrack, isPlaying, isBuffering, isNowPlayingOpen, currentTime, duration, volume, isMuted,
    isStreamVisible, playTrack, togglePlay, setVolume, toggleMute,
    nextTrack, prevTrack, seekTo, toggleStreamVisible, toggleNowPlaying, setNowPlayingOpen, queue,
  } = usePlayerStore();

  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Search state
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [searching, setSearching] = useState(false);

  // Autocomplete Search Suggestions state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLFormElement>(null);

  // Playlists state
  const [userPlaylists, setUserPlaylists] = useState<any[]>([]);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
  const [activeAddToPlaylistTrack, setActiveAddToPlaylistTrack] = useState<Track | null>(null);

  // Likes state
  const [likedSongIds, setLikedSongIds] = useState<string[]>([]);

  // Discover state
  const [discoverResults, setDiscoverResults] = useState<Track[]>([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [activeMood, setActiveMood] = useState('');

  // Social state
  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [discoverListeners, setDiscoverListeners] = useState<any[]>([]);

  // Onboarding taste state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);

  // Homepage Dynamic Music Catalog state
  const [trendingTracks, setTrendingTracks] = useState<Track[]>([]);
  const [recommendedTracks, setRecommendedTracks] = useState<Track[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // AI DJ state
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: "Hey! I'm Aura, your AI DJ. Ask me to create a playlist, find music, or just chat about what you're in the mood for. Try: \"Create a workout playlist\" or \"Songs like Interstellar\"" }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [generatedPlaylist, setGeneratedPlaylist] = useState<any>(null);
  const aiMessagesEndRef = useRef<HTMLDivElement>(null);

  const [isNative, setIsNative] = useState(false);



  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      setIsNative(true);
    }
  }, []);

  // ── Authentication Check & Redirect ──
  useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/login';
    }
  }, [isLoading, isAuthenticated]);

  // ── Onboarding Questionnaire — only show once at first signup ──
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Only show if no preferences AND this session is a fresh signup (not a repeated login)
      const hasSeenOnboarding = typeof window !== 'undefined'
        ? sessionStorage.getItem(`onboarding_shown_${user.id}`)
        : 'true';
      if (!user.preferences && !hasSeenOnboarding) {
        setShowOnboarding(true);
        sessionStorage.setItem(`onboarding_shown_${user.id}`, '1');
      }
    }
  }, [isLoading, isAuthenticated, user]);


  // ── Click Outside Suggestions dropdown ──
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Load User Library Data & Personalized Mixes ──
  useEffect(() => {
    if (isAuthenticated) {
      fetchPlaylists();
      fetchLikedSongs();
      fetchTrending();
      fetchRecommendations();
    } else {
      setUserPlaylists([]);
      setLikedSongIds([]);
      setTrendingTracks([]);
      setRecommendedTracks([]);
    }
  }, [isAuthenticated, user?.preferences]);

  useEffect(() => {
    if (activeTab === 'social' && isAuthenticated) {
      fetchFeed();
      fetchDiscoverListeners();
    }
  }, [activeTab, isAuthenticated]);

  useEffect(() => {
    aiMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const fetchPlaylists = async () => {
    try {
      const data = await fetchApi('/playlists');
      setUserPlaylists(data);
    } catch (e) { /* silent */ }
  };

  const fetchLikedSongs = async () => {
    try {
      const data = await fetchApi('/library/likes/songs');
      setLikedSongIds(data.map((s: any) => s.youtubeId));
    } catch (e) { /* silent */ }
  };

  const fetchTrending = async () => {
    setLoadingTrending(true);
    try {
      const data = await fetchApi('/music/trending');
      // Upgrade thumbnails to HQ
      const enriched = (data || []).map((t: Track) => ({
        ...t,
        thumbnailUrl: hqThumb(t.youtubeId),
      }));
      setTrendingTracks(enriched.slice(0, 20));
    } catch (e) {
      setTrendingTracks(MOCK_TRENDING);
    } finally {
      setLoadingTrending(false);
    }
  };

  const fetchRecommendations = async () => {
    if (!isAuthenticated || !user) return;
    setLoadingRecommendations(true);
    try {
      const upgradeThumb = (tracks: Track[]) =>
        tracks.map(t => ({ ...t, thumbnailUrl: hqThumb(t.youtubeId) }));

      // 1. Try fetching history — use multiple recent artists for variety
      const history = await fetchApi('/library/history');
      if (history && history.length > 0) {
        const artists = [...new Set(
          history.slice(0, 5).map((h: any) => h.song?.artistName || h.artistName).filter(Boolean)
        )] as string[];
        if (artists.length > 0) {
          const queries = artists.slice(0, 3).map((a: string) =>
            fetchApi(`/music/search?q=${encodeURIComponent(a + ' similar music')}`).catch(() => [])
          );
          const results = await Promise.all(queries);
          const merged = results.flat();
          // deduplicate
          const seen = new Set<string>();
          const deduped = merged.filter((t: Track) => {
            if (seen.has(t.youtubeId)) return false;
            seen.add(t.youtubeId);
            return true;
          });
          setRecommendedTracks(upgradeThumb(deduped.slice(0, 20)));
          setLoadingRecommendations(false);
          return;
        }
      }

      // 2. Fallback to onboarding preferences
      if (user.preferences) {
        const prefs = JSON.parse(user.preferences);
        const langs: string[] = prefs.languages || [];
        const artists: string[] = prefs.artists || [];
        const queries = [
          ...langs.slice(0, 2).map(l => fetchApi(`/music/search?q=${encodeURIComponent(l + ' music hits')}`).catch(() => [])),
          ...artists.slice(0, 2).map(a => fetchApi(`/music/search?q=${encodeURIComponent(a)}`).catch(() => [])),
        ];
        const results = await Promise.all(queries);
        const merged = results.flat();
        const seen = new Set<string>();
        const deduped = merged.filter((t: Track) => {
          if (seen.has(t.youtubeId)) return false;
          seen.add(t.youtubeId);
          return true;
        });
        if (deduped.length > 0) {
          setRecommendedTracks(upgradeThumb(deduped.slice(0, 20)));
          setLoadingRecommendations(false);
          return;
        }
      }

      // 3. Absolute fallback to trending
      const data = await fetchApi('/music/trending');
      setRecommendedTracks(upgradeThumb((data || []).slice(0, 20)));
    } catch (e) {
      setRecommendedTracks([]);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const fetchSearchSuggestions = (query: string) => {
    if (suggestionTimeoutRef.current) clearTimeout(suggestionTimeoutRef.current);
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    suggestionTimeoutRef.current = setTimeout(async () => {
      try {
        const data = await fetchApi(`/music/suggestions?q=${encodeURIComponent(query)}`);
        setSuggestions(data);
      } catch (e) {
        setSuggestions([]);
      }
    }, 200);
  };

  const triggerSearchDirectly = async (query: string) => {
    setSearching(true);
    try {
      const data = await fetchApi(`/music/search?q=${encodeURIComponent(query)}`);
      // Upgrade all thumbnails to HQ
      const enriched = (data || []).map((t: Track) => ({ ...t, thumbnailUrl: hqThumb(t.youtubeId) }));
      setSearchResults(enriched);
      setActiveTab('search-results');
    } catch (err: any) {
      alert(err.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  };


  const fetchDiscoverListeners = async () => {
    try {
      const data = await fetchApi('/users/discover-listeners');
      setDiscoverListeners(data);
    } catch (e) {
      setDiscoverListeners([]);
    }
  };

  const handleSaveOnboarding = async () => {
    if (selectedLangs.length === 0 || selectedArtists.length === 0) return;
    try {
      const preferencesObj = {
        languages: selectedLangs,
        artists: selectedArtists
      };
      const res = await fetchApi('/users/me/update', {
        method: 'PUT',
        body: JSON.stringify({
          preferences: JSON.stringify(preferencesObj)
        })
      });
      useAuthStore.getState().updateUser(res.user);
      setShowOnboarding(false);
    } catch (e: any) {
      alert(e.message || 'Failed to save onboarding preferences');
    }
  };

  const fetchFeed = async () => {
    setFeedLoading(true);
    try {
      const data = await fetchApi('/social/feed');
      setActivityFeed(data);
    } catch (e) {
      setActivityFeed([]);
    } finally {
      setFeedLoading(false);
    }
  };




  const handleTrackSelect = (track: Track) => {
    playTrack(track);
    if (isAuthenticated) {
      fetchApi('/library/history', {
        method: 'POST',
        body: JSON.stringify({
          youtubeId: track.youtubeId,
          title: track.title,
          artistName: track.artistName,
          durationSeconds: track.durationSeconds,
          thumbnailUrl: track.thumbnailUrl,
          durationListenedSeconds: 5,
        }),
      }).catch(() => {});
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const data = await fetchApi(`/music/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(data);
      setActiveTab('search-results');
    } catch (err: any) {
      alert(err.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleDiscoverMood = async (mood: { label: string; query: string }) => {
    setActiveMood(mood.label);
    setDiscoverLoading(true);
    setDiscoverResults([]);
    try {
      const data = await fetchApi(`/music/search?q=${encodeURIComponent(mood.query)}`);
      setDiscoverResults(data);
    } catch (err) {
      setDiscoverResults([]);
    } finally {
      setDiscoverLoading(false);
    }
  };

  const handleToggleLike = async (track: Track, e?: React.MouseEvent) => {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    if (!isAuthenticated) { window.location.href = '/login'; return; }
    try {
      const res = await fetchApi('/library/likes', {
        method: 'POST',
        body: JSON.stringify({
          targetId: track.youtubeId,
          targetType: 'SONG',
          songData: { youtubeId: track.youtubeId, title: track.title, artistName: track.artistName, durationSeconds: track.durationSeconds, thumbnailUrl: track.thumbnailUrl },
        }),
      });
      if (res.liked) {
        setLikedSongIds([...likedSongIds, track.youtubeId]);
      } else {
        setLikedSongIds(likedSongIds.filter((id) => id !== track.youtubeId));
      }
    } catch { /* silent */ }
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistTitle.trim()) return;
    try {
      const data = await fetchApi('/playlists', { method: 'POST', body: JSON.stringify({ title: newPlaylistTitle }) });
      setUserPlaylists([data, ...userPlaylists]);
      setNewPlaylistTitle('');
      setShowCreatePlaylistModal(false);
    } catch (err: any) { alert(err.message || 'Failed to create playlist'); }
  };

  const handleAddTrackToPlaylist = async (playlistId: string, track: Track) => {
    try {
      await fetchApi(`/playlists/${playlistId}/songs`, {
        method: 'POST',
        body: JSON.stringify({ youtubeId: track.youtubeId, title: track.title, artistName: track.artistName, durationSeconds: track.durationSeconds, thumbnailUrl: track.thumbnailUrl }),
      });
      setActiveAddToPlaylistTrack(null);
    } catch (err: any) { alert(err.message || 'Failed to add song'); }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    seekTo(((e.clientX - rect.left) / rect.width) * duration);
  };

  // ── AI DJ Chat ───────────────────────────────────────────────────
  const handleAiSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim() || aiLoading) return;

    const userMsg = aiInput.trim();
    setAiInput('');
    setAiMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setAiLoading(true);
    setGeneratedPlaylist(null);

    // Detect if it's a playlist generation request
    const isPlaylistReq = /playlist|mix|create|generate|make me/i.test(userMsg);

    try {
      if (isPlaylistReq) {
        const playlist = await fetchApi('/ai/playlist', {
          method: 'POST',
          body: JSON.stringify({ prompt: userMsg }),
        });
        setGeneratedPlaylist(playlist);
        setAiMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `I created "${playlist.playlistTitle}" for you — ${playlist.description}\n\nFound ${playlist.tracks.length} tracks. Hit play to start the vibe!`,
          },
        ]);
      } else {
        // General DJ chat
        const { reply } = await fetchApi('/ai/dj/chat', {
          method: 'POST',
          body: JSON.stringify({
            message: userMsg,
            history: aiMessages.slice(-8),
          }),
        });
        setAiMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      }
    } catch {
      setAiMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "I'm having a brief moment of static. Please try again!" },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const handlePlayGeneratedPlaylist = () => {
    if (!generatedPlaylist?.tracks?.length) return;
    const { setQueue } = usePlayerStore.getState();
    setQueue(generatedPlaylist.tracks, 0);
  };

  const AI_QUICK_PROMPTS = [
    'Create a coding playlist',
    'Songs like Interstellar',
    'Best workout music',
    'Happy songs from 2010s',
    'Relaxing lo-fi beats',
    'Epic cinematic music',
  ];

  // ── Sidebar nav items ────────────────────────────────────────────
  const navItems = [
    { id: 'home', label: 'Home', icon: Compass },
    { id: 'discover', label: 'Discover', icon: Flame },
    { id: 'playlists', label: 'Playlists', icon: ListMusic },
    { id: 'ai-dj', label: 'AI DJ', icon: Sparkles },
    { id: 'social', label: 'Social Hub', icon: Users },
  ];

  return (
    <div
      className="relative min-h-screen text-white overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #060610 0%, #0a0520 40%, #060612 100%)',
      }}
    >
      {/* Ambient background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-8 blur-3xl"
          style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />
      </div>

      <div className="flex min-h-screen w-full">
        {/* ═══ SIDEBAR (hidden on mobile, visible on md+) ══════════════════ */}
      <aside className={`glass border-r border-white/5 hidden md:flex flex-col z-20 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-5 flex items-center gap-3">
          <button onClick={toggleSidebar} className="w-10 h-10 rounded-xl royal-gradient flex items-center justify-center shadow-lg shadow-primary/25 cursor-pointer flex-shrink-0">
            <Radio className="w-5 h-5 text-white" />
          </button>
          {isSidebarOpen && (
            <span className="font-bold text-lg bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent whitespace-nowrap">
              Aura Stream
            </span>
          )}
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); if (tab.id === 'playlists') fetchPlaylists(); }}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 relative group cursor-pointer ${isActive ? 'text-white bg-white/10' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
              >
                {isActive && (
                  <motion.div layoutId="sidebar-pill" className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-accent rounded-r-full" />
                )}
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-accent' : ''}`} />
                {isSidebarOpen && <span className="text-sm font-semibold">{tab.label}</span>}
              </button>
            );
          })}

          {isSidebarOpen && userPlaylists.length > 0 && (
            <div className="border-t border-white/5 pt-4 mt-4 space-y-1">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold px-4 mb-2">My Playlists</p>
              {userPlaylists.slice(0, 6).map((pl) => (
                <Link key={pl.id} href={`/playlists/${pl.id}`} className="block text-zinc-400 hover:text-white text-sm py-1.5 px-4 rounded-lg hover:bg-white/5 truncate font-medium">
                  {pl.title}
                </Link>
              ))}
            </div>
          )}
        </nav>

        <div className="p-3 border-t border-white/5 space-y-1">
          {!isNative && (
            <Link
              href="/download"
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/5 text-primary hover:text-primary/80 transition-colors cursor-pointer"
            >
              <Smartphone className="w-5 h-5 flex-shrink-0" />
              {isSidebarOpen && <span className="text-sm font-semibold">Download App</span>}
            </Link>
          )}
          <button onClick={toggleTheme} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer">
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {isSidebarOpen && <span className="text-sm font-semibold">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
        </div>
      </aside>

      {/* ═══ MAIN CONTENT ═══════════════════════════════════════════════ */}
      {/* pb-28 for desktop player bar, pb-36 on mobile to clear player + bottom nav */}
      <main className="flex-1 flex flex-col min-w-0 relative h-screen overflow-y-auto pb-36 md:pb-28">

        {/* Header */}
        <header className="sticky top-0 bg-background/85 backdrop-blur-md border-b border-white/5 z-10 px-6 py-4 flex items-center justify-between gap-4">
          <form ref={searchContainerRef} onSubmit={handleSearch} className="w-full max-w-md relative flex flex-col items-center">
            <div className="w-full relative flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                id="search-input"
                placeholder="Search songs, artists, soundtracks..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  fetchSearchSuggestions(e.target.value);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-zinc-500"
              />
              {searching && <Loader2 className="absolute right-3 w-4 h-4 animate-spin text-primary" />}
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-12 left-0 right-0 glass rounded-2xl border border-white/10 shadow-2xl py-2 z-50 overflow-hidden max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSearchQuery(suggestion);
                      setShowSuggestions(false);
                      triggerSearchDirectly(suggestion);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-white/10 text-sm font-medium transition-colors flex items-center gap-2.5 text-zinc-200 hover:text-white cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5 text-zinc-500" />
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </form>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button className="p-2 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
            </button>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all cursor-pointer"
                >
                  <img
                    src={user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80'}
                    alt={user?.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="text-sm font-medium pr-3 hidden md:inline">{user?.username}</span>
                </button>
                <AnimatePresence>
                  {profileDropdownOpen && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-2 w-48 glass rounded-xl shadow-xl py-2 z-30">
                      <Link href="/profile" className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors" onClick={() => setProfileDropdownOpen(false)}>
                        <UserIcon className="w-4 h-4" /> My Profile
                      </Link>
                      <button onClick={() => { logout(); setProfileDropdownOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors text-left cursor-pointer">
                        <LogOut className="w-4 h-4" /> Log Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="px-4 py-2 text-sm font-semibold text-zinc-400 hover:text-white transition-colors">Log In</Link>
                <Link href="/signup" className="px-4 py-2 text-sm font-semibold bg-white text-black rounded-full hover:bg-zinc-200 transition-colors shadow-lg">Sign Up</Link>
              </div>
            )}
          </div>
        </header>

        {/* ── Page Content ─────────────────────────────────────────────── */}
        <div className="px-6 py-6 space-y-8">

          {/* ── SEARCH RESULTS ────────────────────────────────── */}
          {activeTab === 'search-results' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Search className="w-5 h-5 text-accent" /> Results for "{searchQuery}"
                </h2>
                <button onClick={() => setActiveTab('home')} className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer">
                  <X className="w-3.5 h-3.5" /> Clear
                </button>
              </div>
              {searchResults.length === 0 ? (
                <p className="text-zinc-500 text-sm">No tracks found. Try a different phrase.</p>
              ) : (
                <div className="space-y-1">
                  {searchResults.map((track, i) => (
                    <TrackRow
                      key={track.youtubeId}
                      track={track}
                      index={i}
                      isCurrent={currentTrack?.youtubeId === track.youtubeId}
                      isPlaying={isPlaying}
                      isLiked={likedSongIds.includes(track.youtubeId)}
                      isAuthenticated={isAuthenticated}
                      onPlay={() => handleTrackSelect(track)}
                      onLike={(e) => handleToggleLike(track, e)}
                      onAddToPlaylist={(e) => { e.stopPropagation(); setActiveAddToPlaylistTrack(track); }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── PLAYLISTS TAB ─────────────────────────────────── */}
          {activeTab === 'playlists' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ListMusic className="w-5 h-5 text-accent" /> Playlists Library
                </h2>
                {isAuthenticated && (
                  <button onClick={() => setShowCreatePlaylistModal(true)} className="bg-primary hover:bg-primary/90 text-white font-semibold px-4 py-2 rounded-full text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg shadow-primary/20">
                    <PlusCircle className="w-4 h-4" /> Create Playlist
                  </button>
                )}
              </div>

              {!isAuthenticated ? (
                <div className="py-12 text-center">
                  <ListMusic className="w-16 h-16 text-primary/40 mx-auto mb-4" />
                  <p className="text-zinc-400 text-sm mb-4">Log in to create and manage playlists</p>
                  <Link href="/login" className="px-6 py-2.5 bg-primary hover:bg-primary/90 rounded-full text-sm font-semibold transition-colors inline-block">
                    Log In
                  </Link>
                </div>
              ) : userPlaylists.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-sm">
                  <ListMusic className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                  No playlists yet. Create your first one!
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                  {userPlaylists.map((pl) => (
                    <Link key={pl.id} href={`/playlists/${pl.id}`} className="glass-card rounded-2xl p-4 flex flex-col group cursor-pointer">
                      <div className="aspect-square rounded-xl overflow-hidden mb-3 bg-zinc-800 border border-white/5">
                        <img src={pl.coverUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=300&h=300'} alt={pl.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <h4 className="font-bold truncate text-sm">{pl.title}</h4>
                      <p className="text-zinc-400 text-xs mt-1 truncate">
                        {pl._count?.playlistSongs || 0} tracks
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── DISCOVER TAB ──────────────────────────────────── */}
          {activeTab === 'discover' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-extrabold mb-1">Discover</h2>
                <p className="text-zinc-400 text-sm">Explore music by mood, genre, and trending charts</p>
              </div>

              {/* Mood Grid */}
              <div>
                <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-400" /> Explore Moods & Genres
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {DISCOVER_MOODS.map((mood) => (
                    <button
                      key={mood.label}
                      onClick={() => handleDiscoverMood(mood)}
                      className={`p-5 rounded-2xl bg-gradient-to-tr ${mood.color} border border-white/5 hover:border-white/15 transition-all cursor-pointer group hover:scale-[1.02] duration-300 text-left ${activeMood === mood.label ? 'border-primary/40 shadow-lg shadow-primary/10' : ''}`}
                    >
                      <span className="text-3xl block mb-3">{mood.emoji}</span>
                      <h4 className="font-bold text-sm group-hover:text-accent transition-colors">{mood.label}</h4>
                    </button>
                  ))}
                </div>
              </div>

              {/* Results */}
              {(discoverLoading || discoverResults.length > 0) && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <Music2 className="w-4 h-4 text-accent" />
                    {activeMood} {discoverLoading ? '— Loading...' : `— ${discoverResults.length} tracks`}
                  </h3>

                  {discoverLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                      {discoverResults.map((track) => (
                        <TrackCard
                          key={track.youtubeId}
                          track={track}
                          isCurrent={currentTrack?.youtubeId === track.youtubeId}
                          isPlaying={isPlaying}
                          isLiked={likedSongIds.includes(track.youtubeId)}
                          isAuthenticated={isAuthenticated}
                          onPlay={() => handleTrackSelect(track)}
                          onLike={(e) => handleToggleLike(track, e)}
                          onAddToPlaylist={(e) => { e.stopPropagation(); setActiveAddToPlaylistTrack(track); }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!discoverLoading && discoverResults.length === 0 && !activeMood && (
                <div className="py-16 text-center">
                  <Flame className="w-16 h-16 text-orange-500/30 mx-auto mb-4" />
                  <p className="text-zinc-500 text-sm">Select a mood above to discover music</p>
                </div>
              )}
            </div>
          )}

          {/* ── AI DJ TAB ─────────────────────────────────────── */}
          {activeTab === 'ai-dj' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div>
                <h2 className="text-2xl font-extrabold mb-1 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-accent" /> AI DJ & Playlist Generator
                </h2>
                <p className="text-zinc-400 text-sm">Chat with Aura, your AI music expert. Generate playlists, discover new sounds.</p>
              </div>

              {/* Quick prompts */}
              <div>
                <p className="text-xs text-zinc-500 mb-3 font-semibold uppercase tracking-wider">Quick prompts</p>
                <div className="flex flex-wrap gap-2">
                  {AI_QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => { setAiInput(prompt); }}
                      className="text-xs px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/40 text-zinc-300 hover:text-white transition-all cursor-pointer"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Window */}
              <div className="glass rounded-2xl flex flex-col" style={{ height: '420px' }}>
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {aiMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full royal-gradient flex items-center justify-center flex-shrink-0 mr-3 mt-0.5">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                          msg.role === 'user'
                            ? 'bg-primary text-white rounded-br-none'
                            : 'bg-white/5 text-zinc-200 rounded-bl-none'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {aiLoading && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full royal-gradient flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-white/5 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                  <div ref={aiMessagesEndRef} />
                </div>
                <form onSubmit={handleAiSend} className="border-t border-white/5 p-4 flex gap-3">
                  <input
                    type="text"
                    id="ai-chat-input"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="Ask Aura anything about music..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-all placeholder:text-zinc-500"
                    disabled={aiLoading}
                  />
                  <button
                    type="submit"
                    disabled={aiLoading || !aiInput.trim()}
                    className="bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>

              {/* Generated Playlist */}
              {generatedPlaylist && generatedPlaylist.tracks?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card rounded-2xl p-6 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs text-accent font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1">
                        <Sparkles className="w-3.5 h-3.5" /> AI Generated
                      </span>
                      <h3 className="text-lg font-extrabold">{generatedPlaylist.playlistTitle}</h3>
                      <p className="text-zinc-400 text-sm mt-1">{generatedPlaylist.description}</p>
                    </div>
                    <button
                      onClick={handlePlayGeneratedPlaylist}
                      className="bg-white text-black font-semibold px-5 py-2.5 rounded-full hover:scale-105 transition-transform flex items-center gap-2 shadow-lg cursor-pointer flex-shrink-0 ml-4"
                    >
                      <Play className="w-4 h-4 fill-black" /> Play All
                    </button>
                  </div>

                  <div className="space-y-1">
                    {generatedPlaylist.tracks.slice(0, 8).map((track: Track, i: number) => (
                      <TrackRow
                        key={track.youtubeId}
                        track={track}
                        index={i}
                        isCurrent={currentTrack?.youtubeId === track.youtubeId}
                        isPlaying={isPlaying}
                        isLiked={likedSongIds.includes(track.youtubeId)}
                        isAuthenticated={isAuthenticated}
                        onPlay={() => handleTrackSelect(track)}
                        onLike={(e) => handleToggleLike(track, e)}
                        onAddToPlaylist={(e) => { e.stopPropagation(); setActiveAddToPlaylistTrack(track); }}
                      />
                    ))}
                  </div>

                  {isAuthenticated && (
                    <button
                      onClick={async () => {
                        try {
                          const pl = await fetchApi('/playlists', {
                            method: 'POST',
                            body: JSON.stringify({ title: generatedPlaylist.playlistTitle, description: generatedPlaylist.description }),
                          });
                          for (const track of generatedPlaylist.tracks) {
                            await fetchApi(`/playlists/${pl.id}/songs`, {
                              method: 'POST',
                              body: JSON.stringify({ youtubeId: track.youtubeId, title: track.title, artistName: track.artistName, durationSeconds: track.durationSeconds, thumbnailUrl: track.thumbnailUrl }),
                            }).catch(() => {});
                          }
                          fetchPlaylists();
                          alert(`Playlist "${generatedPlaylist.playlistTitle}" saved!`);
                        } catch (e: any) {
                          alert(e.message || 'Failed to save playlist');
                        }
                      }}
                      className="w-full border border-primary/30 hover:bg-primary/10 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer text-primary"
                    >
                      + Save Playlist to Library
                    </button>
                  )}
                </motion.div>
              )}
            </div>
          )}

          {/* ── SOCIAL HUB TAB ────────────────────────────────── */}
          {activeTab === 'social' && (
            <div className="space-y-8 max-w-5xl mx-auto">
                  <div>
                <h2 className="text-2xl font-extrabold mb-1 flex items-center gap-2">
                  <Users className="w-6 h-6 text-accent" /> Social Hub
                </h2>
                <p className="text-zinc-400 text-sm">Connect with other music listeners and check their activity</p>
              </div>

              {!isAuthenticated ? (
                <div className="py-16 text-center glass-card rounded-2xl">
                  <Users className="w-16 h-16 text-accent/30 mx-auto mb-4" />
                  <h3 className="font-bold mb-2">Connect With Music Lovers</h3>
                  <p className="text-zinc-400 text-sm mb-6">Log in to follow friends and see their music activity</p>
                  <Link href="/login" className="px-6 py-2.5 royal-gradient rounded-full text-sm font-semibold inline-block hover:opacity-90 transition-opacity">
                    Log In to Connect
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left: Activity Feed */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="glass rounded-2xl p-6 space-y-4">
                      <h3 className="text-base font-bold flex items-center gap-2 border-b border-white/5 pb-4">
                        <Activity className="w-4 h-4 text-accent" /> Friends' Activity
                      </h3>

                      {feedLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                      ) : activityFeed.length === 0 ? (
                        <div className="py-8 text-center">
                          <Activity className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                          <p className="text-zinc-500 text-sm">No activity yet. Follow other users to see their music!</p>
                          <p className="text-zinc-600 text-xs mt-2">Use the suggestions panel to follow new listeners.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {activityFeed.map((item: any, i: number) => (
                            <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors">
                              <img
                                src={item.user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=40&h=40&q=80'}
                                alt={item.user.username}
                                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm">
                                  <span className="font-bold text-white">{item.user.username}</span>
                                  <span className="text-zinc-400"> listened to </span>
                                  <span className="font-semibold text-accent cursor-pointer hover:text-accent/80" onClick={() => handleTrackSelect({ id: item.song.id, youtubeId: item.song.youtubeId, title: item.song.title, artistName: item.song.artistName, thumbnailUrl: item.song.thumbnailUrl, durationSeconds: item.song.durationSeconds })}>
                                    {item.song.title}
                                  </span>
                                </p>
                                <p className="text-zinc-500 text-xs mt-0.5 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(item.timestamp).toLocaleString()}
                                </p>
                              </div>
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                                <img src={item.song.thumbnailUrl} alt={item.song.title} className="w-full h-full object-cover" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Suggested Users and Profile Quick Link */}
                  <div className="lg:col-span-1 space-y-6">
                    {/* Suggested Listeners to Follow */}
                    <div className="glass rounded-2xl p-6 space-y-4">
                      <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider border-b border-white/5 pb-3">Suggested Listeners</h3>
                      <div className="space-y-4">
                        {discoverListeners.map((listener) => (
                          <div key={listener.id} className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={listener.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=40&h=40&q=80'}
                                alt={listener.username}
                                className="w-8 h-8 rounded-full object-cover border border-primary/20 flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-white truncate">{listener.username}</p>
                                <p className="text-[10px] text-zinc-500 truncate">{listener.bio || 'Music listener'}</p>
                              </div>
                            </div>
                            <button
                              onClick={async () => {
                                try {
                                  await fetchApi(`/social/follow/${listener.username}`, { method: 'POST' });
                                  fetchDiscoverListeners();
                                  fetchFeed();
                                } catch (e) {}
                              }}
                              className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-full text-[10px] font-bold transition-colors cursor-pointer flex-shrink-0"
                            >
                              Follow
                            </button>
                          </div>
                        ))}
                        {discoverListeners.length === 0 && (
                          <p className="text-zinc-500 text-xs italic text-center py-2">No new listeners found to follow</p>
                        )}
                      </div>
                    </div>

                    {/* My Profile Quick Link */}
                    <Link href="/profile" className="glass-card rounded-2xl p-5 flex items-center justify-between group hover:border-primary/30 transition-all block">
                      <div className="flex items-center gap-4">
                        <img
                          src={user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80'}
                          alt={user?.username}
                          className="w-12 h-12 rounded-full object-cover border-2 border-primary/40"
                        />
                        <div className="min-w-0">
                          <p className="font-bold truncate text-sm">{user?.username}</p>
                          <p className="text-zinc-400 text-xs truncate mt-0.5">{user?.bio || 'No bio yet'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-400 group-hover:text-accent transition-colors flex-shrink-0 pl-2">
                        <span className="text-xs font-medium">Profile</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── HOME TAB ──────────────────────────────────────── */}
          {activeTab === 'home' && (
            <>
              {/* Download App Banner (Mobile Web Browser Only) */}
              {!isNative && (
                <section className="md:hidden p-4 rounded-2xl bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-between gap-4 mb-2">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-8 h-8 text-accent flex-shrink-0 animate-bounce" style={{ animationDuration: '3s' }} />
                    <div>
                      <h4 className="font-bold text-sm">Aura Stream for Android</h4>
                      <p className="text-xs text-zinc-300">Install our official app for full-screen lock screen playback and offline features!</p>
                    </div>
                  </div>
                  <Link
                    href="/download"
                    className="bg-primary hover:bg-primary/90 text-white font-bold px-4 py-2 rounded-full text-xs transition-colors shadow-lg shadow-primary/25 flex-shrink-0"
                  >
                    Get App
                  </Link>
                </section>
              )}

              {/* Hero Banner */}
              <section className="relative rounded-2xl overflow-hidden p-8 bg-gradient-to-r from-primary/30 via-accent/5 to-transparent border border-white/5">
                <div className="relative z-10 max-w-lg">
                  <span className="text-accent text-xs font-bold uppercase tracking-widest flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 animate-pulse" /> AI recommendation active
                  </span>
                  <h1 className="text-3xl md:text-4xl font-extrabold mb-3 bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                    Discover your aura.
                  </h1>
                  <p className="text-zinc-300 text-sm leading-relaxed mb-6">
                    Stream millions of tracks, generate AI playlists, and let the AI DJ guide your musical journey — all legally powered by YouTube.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setActiveTab('ai-dj')}
                      className="bg-white text-black font-semibold px-5 py-2.5 rounded-full text-sm hover:scale-105 transition-transform flex items-center gap-2 shadow-lg shadow-white/10 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" /> AI Playlist Generator
                    </button>
                    <button
                      onClick={() => setActiveTab('discover')}
                      className="bg-white/10 hover:bg-white/15 border border-white/10 font-semibold px-5 py-2.5 rounded-full text-sm transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Flame className="w-4 h-4" /> Explore Moods
                    </button>
                  </div>
                </div>
                <div className="absolute right-10 top-1/2 -translate-y-1/2 w-48 h-48 royal-gradient rounded-full blur-[80px] opacity-30 pointer-events-none" />
              </section>

              {/* Recommendations */}
              <section className="space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent" /> 
                  {recommendedTracks.length > 0 && user?.preferences ? "Recommended for You" : "Custom Picks for You"}
                </h2>
                
                {loadingRecommendations ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : recommendedTracks.length === 0 ? (
                  <p className="text-zinc-500 text-sm italic">No recommendations yet. Complete onboarding or play some songs!</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                    {recommendedTracks.slice(0, 4).map((track) => (
                      <TrackCard
                        key={track.youtubeId}
                        track={track}
                        isCurrent={currentTrack?.youtubeId === track.youtubeId}
                        isPlaying={isPlaying}
                        isLiked={likedSongIds.includes(track.youtubeId)}
                        isAuthenticated={isAuthenticated}
                        onPlay={() => handleTrackSelect(track)}
                        onLike={(e) => handleToggleLike(track, e)}
                        onAddToPlaylist={(e) => { e.stopPropagation(); setActiveAddToPlaylistTrack(track); }}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* Trending Tracks Grid */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-accent" /> Trending Tracks
                  </h2>
                  <button onClick={() => setActiveTab('discover')} className="text-sm text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors">
                    Discover more <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                
                {loadingTrending ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                    {(trendingTracks.length > 0 ? trendingTracks : MOCK_TRENDING).slice(0, 4).map((track) => (
                      <TrackCard
                        key={track.youtubeId}
                        track={track}
                        isCurrent={currentTrack?.youtubeId === track.youtubeId}
                        isPlaying={isPlaying}
                        isLiked={likedSongIds.includes(track.youtubeId)}
                        isAuthenticated={isAuthenticated}
                        onPlay={() => handleTrackSelect(track)}
                        onLike={(e) => handleToggleLike(track, e)}
                        onAddToPlaylist={(e) => { e.stopPropagation(); setActiveAddToPlaylistTrack(track); }}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* Recently Played (if authenticated) */}
              {isAuthenticated && queue.length > 0 && (
                <section className="space-y-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-400" /> Queue
                  </h2>
                  <div className="glass rounded-2xl p-4 space-y-1">
                    {queue.slice(0, 5).map((track, i) => (
                      <TrackRow
                        key={track.youtubeId}
                        track={track}
                        index={i}
                        isCurrent={currentTrack?.youtubeId === track.youtubeId}
                        isPlaying={isPlaying}
                        isLiked={likedSongIds.includes(track.youtubeId)}
                        isAuthenticated={isAuthenticated}
                        onPlay={() => handleTrackSelect(track)}
                        onLike={(e) => handleToggleLike(track, e)}
                        onAddToPlaylist={(e) => { e.stopPropagation(); setActiveAddToPlaylistTrack(track); }}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>
    </div>

      {/* ═══ BOTTOM PLAYER BAR (responsive) ════════════════════════════ */}
      {/* On mobile: tapping the track info opens full-screen Now Playing */}
      <footer
        id="player-footer"
        onClick={() => {
          if (window.innerWidth < 768 && currentTrack) {
            toggleNowPlaying();
          }
        }}
        style={{
          position: 'fixed',
          zIndex: 30,
        }}
        className={`player-footer fixed z-30 transition-all duration-300 flex items-center justify-between gap-3 left-2 right-2 bottom-[68px] h-14 rounded-xl px-3 bg-zinc-900/90 backdrop-blur-md border border-white/10 shadow-lg md:left-0 md:right-0 md:bottom-0 md:h-24 md:rounded-none md:bg-[#121212]/95 md:backdrop-blur-xl md:border-t md:border-x-0 md:border-b-0 md:border-white/5 md:shadow-none md:px-6 ${isSidebarOpen ? 'md:left-64' : 'md:left-20'} ${isNowPlayingOpen ? 'hidden md:flex' : 'flex'} cursor-pointer md:cursor-default`}
      >
        {/* Track Info — tappable to open Now Playing */}
        <div
          className="flex items-center gap-2 md:gap-4 flex-1 md:flex-initial md:w-1/4 md:min-w-[180px] flex-shrink-0 min-w-0 cursor-pointer md:cursor-default"
          onClick={(e) => {
            if (window.innerWidth >= 768 && currentTrack) {
              e.stopPropagation();
              toggleNowPlaying();
            }
          }}
        >
          {currentTrack ? (
            <>
              <div className="w-9 h-9 md:w-14 md:h-14 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0 shadow-lg relative">
                <img src={currentTrack.thumbnailUrl} alt={currentTrack.title} className="object-cover w-full h-full" />
                {/* Mobile expand indicator */}
                <div className="absolute inset-0 bg-black/30 md:hidden flex items-center justify-center opacity-0 active:opacity-100 transition-opacity">
                  <ChevronRight className="w-4 h-4 text-white rotate-[-90deg]" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-xs md:text-sm truncate">{currentTrack.title}</h4>
                <p className="text-zinc-400 text-[10px] md:text-xs truncate mt-0.5">{currentTrack.artistName}</p>
              </div>
              <button
                id="player-footer-like-btn"
                aria-label={likedSongIds.includes(currentTrack.youtubeId) ? "Unlike song" : "Like song"}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleLike(currentTrack, e);
                }}
                className={`transition-colors ml-1 flex-shrink-0 hidden md:block ${
                  likedSongIds.includes(currentTrack.youtubeId) ? 'text-accent' : 'text-zinc-400 hover:text-accent'
                }`}
              >
                <Heart className={`w-4 h-4 ${likedSongIds.includes(currentTrack.youtubeId) ? 'fill-accent' : ''}`} />
              </button>
            </>
          ) : (
            <span className="text-zinc-500 text-xs md:text-sm">No track selected</span>
          )}
        </div>

        {/* Playback Controls */}
        <div className="hidden md:flex flex-col items-center gap-1 md:gap-2 flex-1 max-w-xl">
          <div className="flex items-center gap-4 md:gap-5">
            <button
              id="player-footer-prev-btn"
              aria-label="Previous track"
              onClick={(e) => { e.stopPropagation(); prevTrack(); }}
              className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <SkipBack className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <button
              id="player-footer-play-btn"
              aria-label={isPlaying ? "Pause music" : "Play music"}
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-lg cursor-pointer"
            >
              {isBuffering 
                ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin text-primary" />
                : isPlaying 
                  ? <Pause className="w-4 h-4 md:w-5 md:h-5 fill-black" /> 
                  : <Play className="w-4 h-4 md:w-5 md:h-5 fill-black translate-x-0.5" />}
            </button>
            <button
              id="player-footer-next-btn"
              aria-label="Next track"
              onClick={(e) => { e.stopPropagation(); nextTrack(); }}
              className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <SkipForward className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
          <div className="w-full flex items-center gap-2 md:gap-3 text-xs text-zinc-500">
            <span className="w-7 md:w-8 text-right text-[10px] md:text-xs">{formatTrackTime(currentTime)}</span>
            <div onClick={(e) => { e.stopPropagation(); handleProgressClick(e); }} className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden relative cursor-pointer group">
              <div
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-primary to-accent group-hover:from-primary/90 group-hover:to-accent/90 transition-all"
              />
            </div>
            <span className="w-7 md:w-8 text-[10px] md:text-xs">{formatTrackTime(duration || currentTrack?.durationSeconds || 0)}</span>
          </div>
        </div>

        {/* Volume & Stream Controls — desktop only */}
        <div className="hidden md:flex items-center justify-end gap-4 w-1/4 min-w-[180px]">
          <button
            onClick={(e) => { e.stopPropagation(); toggleStreamVisible(); }}
            className={`p-2 rounded-lg transition-all cursor-pointer ${isStreamVisible ? 'bg-primary/20 text-accent border border-primary/30' : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
            title="Toggle Video Stream"
          >
            <Tv className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <button onClick={(e) => { e.stopPropagation(); toggleMute(); }} className="text-zinc-400 hover:text-white transition-colors cursor-pointer">
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              onClick={(e) => e.stopPropagation()}
              className="w-20 accent-primary cursor-pointer h-1"
            />
          </div>
        </div>

        {/* Mobile Controls */}
        <div className="flex md:hidden items-center gap-1.5 flex-shrink-0">
          {currentTrack && (
            <button
              id="mini-player-like-btn"
              aria-label={likedSongIds.includes(currentTrack.youtubeId) ? "Unlike song" : "Like song"}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleLike(currentTrack, e);
              }}
              className={`p-2 transition-colors active:scale-90 cursor-pointer ${
                likedSongIds.includes(currentTrack.youtubeId) ? 'text-accent' : 'text-zinc-400'
              }`}
            >
              <Heart className={`w-5 h-5 ${likedSongIds.includes(currentTrack.youtubeId) ? 'fill-accent' : ''}`} />
            </button>
          )}
          <button
            id="mini-player-play-btn"
            aria-label={isPlaying ? "Pause music" : "Play music"}
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            disabled={!currentTrack}
            className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center active:scale-95 transition-transform cursor-pointer disabled:opacity-70"
          >
            {isBuffering ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4 fill-black text-black" />
            ) : (
              <Play className="w-4 h-4 fill-black text-black translate-x-0.5" />
            )}
          </button>
          <button
            id="mini-player-next-btn"
            aria-label="Next track"
            onClick={(e) => {
              e.stopPropagation();
              nextTrack();
            }}
            disabled={!currentTrack}
            className="p-2 text-zinc-400 active:text-white active:scale-90 transition-transform cursor-pointer"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile bottom progress line */}
        {currentTrack && (
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10 rounded-b-xl overflow-hidden md:hidden">
            <div
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
            />
          </div>
        )}
      </footer>

      {/* ═══ MOBILE BOTTOM NAV BAR (md+ hidden) ═══════════════════════════ */}
      <nav className="fixed bottom-0 left-0 right-0 h-14 glass border-t border-white/10 flex md:hidden items-center justify-around z-40 px-2">
        {navItems.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); if (tab.id === 'playlists') fetchPlaylists(); }}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                isActive ? 'text-accent' : 'text-zinc-500'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-accent' : ''}`} />
              <span className="text-[9px] font-semibold">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ═══ MODALS ══════════════════════════════════════════════════════ */}

      {/* Add to Playlist Modal */}
      {activeAddToPlaylistTrack && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass w-full max-w-sm rounded-2xl p-6 border border-white/10">
            <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4">
              <h3 className="font-bold text-sm">Add to Playlist</h3>
              <button onClick={() => setActiveAddToPlaylistTrack(null)} className="text-zinc-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-zinc-400 text-xs mb-4">Add "{activeAddToPlaylistTrack.title}" to:</p>
            <div className="max-h-56 overflow-y-auto space-y-2 mb-4">
              {userPlaylists.map((pl) => (
                <button
                  key={pl.id}
                  onClick={() => handleAddTrackToPlaylist(pl.id, activeAddToPlaylistTrack)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-primary/20 hover:border-primary/30 border border-transparent transition-all text-left cursor-pointer text-sm font-semibold"
                >
                  <ListMusic className="w-4 h-4 text-accent" />
                  <span className="truncate">{pl.title}</span>
                </button>
              ))}
              {userPlaylists.length === 0 && <p className="text-zinc-500 text-xs italic text-center py-4">No playlists created yet.</p>}
            </div>
            <button
              onClick={() => { setActiveAddToPlaylistTrack(null); setActiveTab('playlists'); setShowCreatePlaylistModal(true); }}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 py-2.5 rounded-xl text-xs font-semibold text-center cursor-pointer"
            >
              + Create New Playlist
            </button>
          </motion.div>
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreatePlaylistModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.form
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onSubmit={handleCreatePlaylist}
            className="glass w-full max-w-sm rounded-2xl p-6 border border-white/10"
          >
            <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-5">
              <h3 className="font-bold text-sm">Create Playlist</h3>
              <button type="button" onClick={() => setShowCreatePlaylistModal(false)} className="text-zinc-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-zinc-400 text-xs mb-2">Playlist Title</label>
                <input
                  type="text"
                  required
                  placeholder="My Playlist"
                  value={newPlaylistTitle}
                  onChange={(e) => setNewPlaylistTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowCreatePlaylistModal(false)} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-2.5 text-xs font-semibold cursor-pointer">
                Cancel
              </button>
              <button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-xl py-2.5 text-xs font-semibold cursor-pointer shadow-lg shadow-primary/20">
                Create
              </button>
            </div>
          </motion.form>
        </div>
      )}

      {/* Onboarding Taste Questionnaire */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-[#060610]/95 backdrop-blur-xl z-50 flex flex-col justify-center items-center p-6 overflow-y-auto">
          <div className="max-w-xl w-full glass p-8 rounded-3xl border border-white/10 shadow-2xl relative">
            <h2 className="text-2xl font-extrabold text-center mb-1 shimmer-text">
              Welcome to Aura Stream!
            </h2>
            <p className="text-zinc-400 text-sm text-center mb-8">
              Let's customize your profile to give you the best music recommendations.
            </p>
            
            {/* Step 1: Select Languages */}
            <div className="space-y-3 mb-6">
              <label className="block text-zinc-300 text-xs font-bold uppercase tracking-wider">
                1. Select Preferred Languages
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Telugu', emoji: '🎵', value: 'Telugu' },
                  { label: 'Tamil', emoji: '🎻', value: 'Tamil' },
                  { label: 'Hindi', emoji: '💃', value: 'Hindi' },
                  { label: 'English', emoji: '🎧', value: 'English' }
                ].map((lang) => {
                  const selected = selectedLangs.includes(lang.value);
                  return (
                    <button
                      key={lang.value}
                      type="button"
                      onClick={() => {
                        if (selected) {
                          setSelectedLangs(selectedLangs.filter(l => l !== lang.value));
                        } else {
                          setSelectedLangs([...selectedLangs, lang.value]);
                        }
                      }}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                        selected 
                          ? 'bg-primary/30 border-primary text-white shadow-lg' 
                          : 'bg-white/5 border-white/5 text-zinc-400 hover:border-white/10 hover:text-white'
                      }`}
                    >
                      <span className="text-lg">{lang.emoji}</span>
                      {lang.label}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Step 2: Select Preferred Artists */}
            <div className="space-y-3 mb-8">
              <label className="block text-zinc-300 text-xs font-bold uppercase tracking-wider">
                2. Select Preferred Artists (Select at least 1)
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { name: 'A.R. Rahman', value: 'A.R. Rahman', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&h=100&fit=crop&q=80' },
                  { name: 'Anirudh', value: 'Anirudh', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&h=100&fit=crop&q=80' },
                  { name: 'Sid Sriram', value: 'Sid Sriram', img: 'https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?w=100&h=100&fit=crop&q=80' },
                  { name: 'Pritam', value: 'Pritam', img: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop&q=80' },
                  { name: 'Hans Zimmer', value: 'Hans Zimmer', img: 'https://images.unsplash.com/photo-1444084316824-dc269f705b2b?w=100&h=100&fit=crop&q=80' },
                  { name: 'The Weeknd', value: 'The Weeknd', img: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=100&h=100&fit=crop&q=80' }
                ].map((artist) => {
                  const selected = selectedArtists.includes(artist.value);
                  return (
                    <button
                      key={artist.value}
                      type="button"
                      onClick={() => {
                        if (selected) {
                          setSelectedArtists(selectedArtists.filter(a => a !== artist.value));
                        } else {
                          setSelectedArtists([...selectedArtists, artist.value]);
                        }
                      }}
                      className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        selected 
                          ? 'bg-primary/30 border-primary text-white shadow-lg' 
                          : 'bg-white/5 border-white/5 text-zinc-400 hover:border-white/10 hover:text-white'
                      }`}
                    >
                      <img
                        src={artist.img}
                        alt={artist.name}
                        className="w-12 h-12 rounded-full object-cover mb-2 border border-white/10"
                      />
                      <span className="text-[10px] font-bold leading-tight truncate w-full">{artist.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            <button
              type="button"
              onClick={handleSaveOnboarding}
              disabled={selectedLangs.length === 0 || selectedArtists.length === 0}
              className="w-full royal-gradient text-white rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Aura Stream
            </button>
          </div>
        </div>
      )}

      {/* ═══ FULL-SCREEN NOW PLAYING (mobile) ═══════════════════════════ */}
      <NowPlayingScreen
        isLiked={currentTrack ? likedSongIds.includes(currentTrack.youtubeId) : false}
        onToggleLike={() => currentTrack && handleToggleLike(currentTrack)}
        onAddToPlaylist={() => { if (currentTrack) { setNowPlayingOpen(false); setActiveAddToPlaylistTrack(currentTrack); } }}
      />
    </div>
  );
}
