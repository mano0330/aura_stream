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
  youtubePlayer: any | null; // Ref to YT.Player instance
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
  
  // Stop everything
  stopAll: () => void;

  // Queue actions
  addToQueue: (track: Track) => void;
  setQueue: (tracks: Track[], startIndex?: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (seconds: number) => void;
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
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return;
    }
    const { queue, youtubePlayer } = get();
    // Add track to queue if not present, or find its index
    let newQueue = [...queue];
    let index = newQueue.findIndex((t) => t.youtubeId === track.youtubeId);
    
    if (index === -1) {
      newQueue.push(track);
      index = newQueue.length - 1;
    }

    set({ 
      currentTrack: track, 
      isPlaying: true,
      isBuffering: true,
      queue: newQueue, 
      queueIndex: index,
      currentTime: 0 
    });

    if (youtubePlayer && youtubePlayer.loadVideoById) {
      try { youtubePlayer.loadVideoById(track.youtubeId); } catch (e) { /* ignore */ }
    }
  },

  togglePlay: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
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
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return;
    }
    set((state) => {
      // Avoid duplicates in queue
      if (state.queue.some((t) => t.youtubeId === track.youtubeId)) return state;
      return { queue: [...state.queue, track] };
    });
  },

  setQueue: (tracks, startIndex = 0) => {
    if (!useAuthStore.getState().isAuthenticated) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return;
    }
    const { youtubePlayer } = get();
    const currentTrack = tracks[startIndex] || null;
    
    set({ 
      queue: tracks, 
      queueIndex: startIndex, 
      currentTrack, 
      isPlaying: !!currentTrack,
      currentTime: 0 
    });

    if (youtubePlayer && currentTrack && youtubePlayer.loadVideoById) {
      youtubePlayer.loadVideoById(currentTrack.youtubeId);
    }
  },

  nextTrack: () => {
    const { queue, queueIndex, playTrack } = get();
    if (queue.length === 0) return;
    
    const nextIndex = (queueIndex + 1) % queue.length;
    playTrack(queue[nextIndex]);
  },

  prevTrack: () => {
    const { queue, queueIndex, playTrack, currentTime, seekTo } = get();
    if (queue.length === 0) return;
    
    // If track has been playing for more than 3s, restart it instead of going back
    if (currentTime > 3) {
      seekTo(0);
      return;
    }

    const prevIndex = queueIndex - 1 < 0 ? queue.length - 1 : queueIndex - 1;
    playTrack(queue[prevIndex]);
  },

  seekTo: (seconds) => {
    const { youtubePlayer } = get();
    if (youtubePlayer && youtubePlayer.seekTo) {
      youtubePlayer.seekTo(seconds, true);
      set({ currentTime: seconds });
    }
  }
}));

// Subscribe to auth store to stop playback on logout
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
