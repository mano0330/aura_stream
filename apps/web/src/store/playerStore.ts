import { create } from 'zustand';
import { useAuthStore } from './authStore';

export interface Track {
  id: string;
  youtubeId: string;
  title: string;
  artistId?: string;
  artistName: string;
  albumName?: string;
  thumbnailUrl?: string;
  durationSeconds: number;
}

interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  queue: Track[];
  queueIndex: number;
  recentlyPlayed: Track[];
  youtubePlayer: any | null;
  isStreamVisible: boolean;
  isNowPlayingOpen: boolean;

  // Actions
  setYoutubePlayer: (player: any) => void;
  toggleStreamVisible: () => void;
  toggleNowPlaying: () => void;
  setNowPlayingOpen: (open: boolean) => void;
  playTrack: (track: Track) => void;
  togglePlay: () => void;
  setPlaying: (playing: boolean) => void;
  setBuffering: (buffering: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  stopAll: () => void;
  addToQueue: (track: Track) => void;
  setQueue: (tracks: Track[], startIndex?: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (seconds: number) => void;
}

// Fetch related tracks from backend API
async function fetchRelatedTracks(track: Track): Promise<Track[]> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('aura_token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const query = encodeURIComponent(`${track.artistName} similar songs`);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://aurastream-mano0330s-projects.vercel.app';
    const res = await fetch(`${apiUrl}/music/search?q=${query}`, { headers });
    if (!res.ok) return [];
    const data: Track[] = await res.json();
    return data.filter((t) => t.youtubeId !== track.youtubeId);
  } catch {
    return [];
  }
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  isBuffering: false,
  currentTime: 0,
  duration: 0,
  volume: 70,
  isMuted: false,
  queue: [],
  queueIndex: -1,
  recentlyPlayed: [],
  youtubePlayer: null,
  isStreamVisible: false,
  isNowPlayingOpen: false,

  setYoutubePlayer: (player) => set({ youtubePlayer: player }),
  setBuffering: (buffering) => set({ isBuffering: buffering }),
  toggleStreamVisible: () => set((state) => ({ isStreamVisible: !state.isStreamVisible })),
  toggleNowPlaying: () => set((state) => ({ isNowPlayingOpen: !state.isNowPlayingOpen })),
  setNowPlayingOpen: (open) => set({ isNowPlayingOpen: open }),

  stopAll: () => {
    const { youtubePlayer } = get();
    if (youtubePlayer && youtubePlayer.stopVideo) {
      try { youtubePlayer.stopVideo(); } catch (e) { /* ignore */ }
    }
    set({ currentTrack: null, isPlaying: false, isBuffering: false, currentTime: 0, duration: 0, queue: [], queueIndex: -1 });
  },

  playTrack: (track) => {
    if (!useAuthStore.getState().isAuthenticated) {
      if (typeof window !== 'undefined') window.location.href = '/login';
      return;
    }
    const { queue, youtubePlayer, recentlyPlayed } = get();
    let newQueue = [...queue];
    let index = newQueue.findIndex((t) => t.youtubeId === track.youtubeId);

    if (index === -1) {
      newQueue.push(track);
      index = newQueue.length - 1;
    }

    const newRecent = [track, ...recentlyPlayed.filter(t => t.youtubeId !== track.youtubeId)].slice(0, 10);

    set({
      currentTrack: track,
      isPlaying: true,
      isBuffering: true,
      queue: newQueue,
      queueIndex: index,
      currentTime: 0,
      recentlyPlayed: newRecent,
    });

    if (youtubePlayer && youtubePlayer.loadVideoById) {
      try { youtubePlayer.loadVideoById(track.youtubeId); } catch (e) { /* ignore */ }
    }
  },

  togglePlay: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      if (typeof window !== 'undefined') window.location.href = '/login';
      return;
    }
    const { isPlaying, youtubePlayer, currentTrack } = get();
    if (!currentTrack) return;

    if (youtubePlayer) {
      if (isPlaying) {
        youtubePlayer.pauseVideo();
      } else {
        youtubePlayer.playVideo();
      }
    }
    set({ isPlaying: !isPlaying });
  },

  setPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),

  setVolume: (volume) => {
    const { youtubePlayer } = get();
    if (youtubePlayer && youtubePlayer.setVolume) {
      youtubePlayer.setVolume(volume);
    }
    set({ volume, isMuted: volume === 0 });
  },

  toggleMute: () => {
    const { isMuted, volume, youtubePlayer } = get();
    if (youtubePlayer) {
      if (isMuted) {
        youtubePlayer.unMute();
        youtubePlayer.setVolume(volume || 70);
      } else {
        youtubePlayer.mute();
      }
    }
    set({ isMuted: !isMuted });
  },

  addToQueue: (track) => {
    if (!useAuthStore.getState().isAuthenticated) {
      if (typeof window !== 'undefined') window.location.href = '/login';
      return;
    }
    set((state) => {
      if (state.queue.some((t) => t.youtubeId === track.youtubeId)) return state;
      return { queue: [...state.queue, track] };
    });
  },

  setQueue: (tracks, startIndex = 0) => {
    if (!useAuthStore.getState().isAuthenticated) {
      if (typeof window !== 'undefined') window.location.href = '/login';
      return;
    }
    const { youtubePlayer } = get();
    const currentTrack = tracks[startIndex] || null;

    set({
      queue: tracks,
      queueIndex: startIndex,
      currentTrack,
      isPlaying: !!currentTrack,
      currentTime: 0,
    });

    if (youtubePlayer && currentTrack && youtubePlayer.loadVideoById) {
      youtubePlayer.loadVideoById(currentTrack.youtubeId);
    }
  },

  nextTrack: () => {
    const { queue, queueIndex, currentTrack, recentlyPlayed, youtubePlayer } = get();

    // 1. Play next track in queue if available
    const nextIndex = queueIndex + 1;
    if (nextIndex < queue.length) {
      const next = queue[nextIndex];
      const newRecent = [next, ...recentlyPlayed.filter(t => t.youtubeId !== next.youtubeId)].slice(0, 10);
      set({ currentTrack: next, queueIndex: nextIndex, isPlaying: true, isBuffering: true, currentTime: 0, recentlyPlayed: newRecent });
      if (youtubePlayer?.loadVideoById) {
        try { youtubePlayer.loadVideoById(next.youtubeId); } catch (e) { /* ignore */ }
      }
      return;
    }

    // 2. Queue exhausted — fetch recommendation based on current/recent track
    const seedTrack = currentTrack || recentlyPlayed[0];
    if (!seedTrack) return;

    set({ isBuffering: true });
    fetchRelatedTracks(seedTrack).then((related) => {
      if (related.length === 0) {
        set({ isBuffering: false });
        return;
      }

      // Prefer tracks not recently played
      const recentIds = new Set(get().recentlyPlayed.map(t => t.youtubeId));
      const fresh = related.filter(t => !recentIds.has(t.youtubeId));
      const pool = fresh.length > 0 ? fresh : related;
      const randomTrack = pool[Math.floor(Math.random() * pool.length)];

      const currentRecent = get().recentlyPlayed;
      const newRecent = [randomTrack, ...currentRecent.filter(t => t.youtubeId !== randomTrack.youtubeId)].slice(0, 10);
      const newQueue = [...get().queue, randomTrack];
      const newIndex = newQueue.length - 1;

      set({
        currentTrack: randomTrack,
        queue: newQueue,
        queueIndex: newIndex,
        isPlaying: true,
        isBuffering: true,
        currentTime: 0,
        recentlyPlayed: newRecent,
      });

      if (youtubePlayer?.loadVideoById) {
        try { youtubePlayer.loadVideoById(randomTrack.youtubeId); } catch (e) { /* ignore */ }
      }
    });
  },

  prevTrack: () => {
    const { queue, queueIndex, currentTime, seekTo, youtubePlayer, recentlyPlayed } = get();

    // If played more than 3 seconds, restart current track
    if (currentTime > 3) {
      seekTo(0);
      return;
    }

    const prevIndex = queueIndex - 1 < 0 ? 0 : queueIndex - 1;
    if (queue.length === 0 || prevIndex === queueIndex) return;
    const prev = queue[prevIndex];
    const newRecent = [prev, ...recentlyPlayed.filter(t => t.youtubeId !== prev.youtubeId)].slice(0, 10);
    set({ currentTrack: prev, queueIndex: prevIndex, isPlaying: true, isBuffering: true, currentTime: 0, recentlyPlayed: newRecent });
    if (youtubePlayer?.loadVideoById) {
      try { youtubePlayer.loadVideoById(prev.youtubeId); } catch (e) { /* ignore */ }
    }
  },

  seekTo: (seconds) => {
    const { youtubePlayer } = get();
    if (youtubePlayer && youtubePlayer.seekTo) {
      youtubePlayer.seekTo(seconds, true);
      set({ currentTime: seconds });
    }
  },
}));

// Stop playback on logout
if (typeof window !== 'undefined') {
  useAuthStore.subscribe((authState) => {
    if (!authState.isAuthenticated) {
      const playerState = usePlayerStore.getState();
      if (playerState.currentTrack !== null) {
        playerState.stopAll();
      }
    }
  });
}
