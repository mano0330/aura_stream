'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import { Minimize2, Tv, Loader2 } from 'lucide-react';

declare global {
  interface Window {
    onYouTubeIframeAPIReady: (() => void) | undefined;
    YT: any;
  }
}

export default function YouTubePlayer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const loadedVideoIdRef = useRef<string | null>(null);
  const [apiReady, setApiReady] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { 
    currentTrack, 
    volume, 
    isMuted, 
    isPlaying,
    isBuffering,
    isStreamVisible,
    youtubePlayer,
    setYoutubePlayer,
    setBuffering,
    setPlaying, 
    setCurrentTime, 
    setDuration, 
    nextTrack,
    toggleStreamVisible
  } = usePlayerStore();

  // Load YouTube IFrame API once
  useEffect(() => {
    setMounted(true);
    const loadAPI = () => {
      if (window.YT && window.YT.Player) {
        setApiReady(true);
        return;
      }

      // If API is loading, wait for it
      if (window.onYouTubeIframeAPIReady) {
        const original = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          original();
          setApiReady(true);
        };
        return;
      }

      window.onYouTubeIframeAPIReady = () => {
        setApiReady(true);
      };

      if (!document.getElementById('yt-api-script')) {
        const tag = document.createElement('script');
        tag.id = 'yt-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
    };

    loadAPI();

    return () => {
      if (timeUpdateInterval.current) {
        clearInterval(timeUpdateInterval.current);
      }
    };
  }, []);

  // Initialize player once API is ready
  useEffect(() => {
    if (!apiReady) return;
    initPlayer();
  }, [apiReady]);

  const timeUpdateInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const initPlayer = () => {
    if (playerRef.current || !document.getElementById('yt-iframe-container')) return;

    playerRef.current = new window.YT.Player('yt-iframe-container', {
      height: '100%',
      width: '100%',
      videoId: '',
      playerVars: {
        playsinline: 1,      // Critical for iOS inline playback
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        autoplay: 0,
        origin: window.location.origin,
      },
      events: {
        onReady: (event: any) => {
          setYoutubePlayer(event.target);
          event.target.setVolume(volume);
          if (isMuted) event.target.mute();

          // If a track was selected before player was ready, load it now
          const { currentTrack: ct, isPlaying: ip } = usePlayerStore.getState();
          if (ct) {
            loadedVideoIdRef.current = ct.youtubeId;
            if (ip) {
              event.target.loadVideoById(ct.youtubeId);
            } else {
              event.target.cueVideoById(ct.youtubeId);
            }
          }
        },
        onStateChange: (event: any) => {
          const state = event.data;

          if (state === window.YT.PlayerState.PLAYING) {   // 1
            setBuffering(false);
            setPlaying(true);
            setDuration(event.target.getDuration());
            startTrackingTime();
          } else if (state === window.YT.PlayerState.PAUSED) {  // 2
            setBuffering(false);
            setPlaying(false);
            stopTrackingTime();
          } else if (state === window.YT.PlayerState.ENDED) {   // 0
            setBuffering(false);
            setPlaying(false);
            stopTrackingTime();
            nextTrack();
          } else if (state === window.YT.PlayerState.BUFFERING) { // 3
            setBuffering(true);
          } else if (state === window.YT.PlayerState.CUED) {     // 5
            setBuffering(false);
          }
        },
        onError: (event: any) => {
          // Silently handle errors - auto-skip to next track on any playback error to prevent getting stuck
          setBuffering(false);
          nextTrack();
        },
      },
    });
  };

  // Sync track changes
  useEffect(() => {
    if (!youtubePlayer || !currentTrack) return;

    if (loadedVideoIdRef.current !== currentTrack.youtubeId) {
      loadedVideoIdRef.current = currentTrack.youtubeId;
      setBuffering(true);
      if (isPlaying) {
        youtubePlayer.loadVideoById(currentTrack.youtubeId);
      } else {
        youtubePlayer.cueVideoById(currentTrack.youtubeId);
      }
    }
  }, [currentTrack, youtubePlayer]);

  // Sync play/pause state
  useEffect(() => {
    if (!youtubePlayer || !currentTrack) return;

    try {
      const playerState = youtubePlayer.getPlayerState();
      // States: -1=unstarted, 0=ended, 1=playing, 2=paused, 3=buffering, 5=cued
      if (isPlaying && playerState !== 1 && playerState !== 3) {
        setBuffering(true);
        youtubePlayer.playVideo();
      } else if (!isPlaying && playerState === 1) {
        youtubePlayer.pauseVideo();
      }
    } catch (e) {
      // Player may not be ready
    }
  }, [isPlaying, youtubePlayer, currentTrack]);

  const startTrackingTime = () => {
    if (timeUpdateInterval.current) clearInterval(timeUpdateInterval.current);
    
    timeUpdateInterval.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        try {
          setCurrentTime(playerRef.current.getCurrentTime());
        } catch (e) { /* ignore */ }
      }
    }, 500);
  };

  const stopTrackingTime = () => {
    if (timeUpdateInterval.current) {
      clearInterval(timeUpdateInterval.current);
      timeUpdateInterval.current = null;
    }
  };

  // Keep volume synced
  useEffect(() => {
    if (playerRef.current && playerRef.current.setVolume) {
      try { playerRef.current.setVolume(volume); } catch (e) { /* ignore */ }
    }
  }, [volume]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = containerRef.current?.parentElement;
    if (el) {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      console.log("YT_PLAYER_CONTAINER_STYLE:", JSON.stringify({
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        width: rect.width,
        height: rect.height,
        position: style.position,
        zIndex: style.zIndex,
      }));
    }
  }, [isStreamVisible]);

  // Keep mute synced
  useEffect(() => {
    if (playerRef.current && playerRef.current.mute) {
      try {
        if (isMuted) {
          playerRef.current.mute();
        } else {
          playerRef.current.unMute();
        }
      } catch (e) { /* ignore */ }
    }
  }, [isMuted]);

  if (!mounted) return null;

  return (
    <div 
      className="fixed bottom-28 transition-all duration-300 rounded-xl overflow-hidden glass shadow-2xl border border-white/10 w-80 h-48 z-30"
      style={{
        right: isStreamVisible ? '32px' : 'auto',
        left: isStreamVisible ? 'auto' : '-9999px',
        opacity: isStreamVisible ? 1 : 0,
        transform: isStreamVisible ? 'scale(1)' : 'scale(0.95)',
        pointerEvents: isStreamVisible ? 'auto' : 'none',
      }}
    >
      <div className="bg-[#0f0f15] p-2 flex items-center justify-between border-b border-white/5">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
          <Tv className="w-3.5 h-3.5 text-purple-400" /> 
          {isBuffering ? 'Buffering...' : 'Active Video Stream'}
        </span>
        <button 
          onClick={toggleStreamVisible}
          className="p-1 hover:bg-white/5 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
          title="Minimize Stream"
        >
          <Minimize2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div ref={containerRef} className="w-full h-[calc(100%-36px)] bg-black relative">
        <div id="yt-iframe-container" className="w-full h-full" />
        {isBuffering && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          </div>
        )}
      </div>
    </div>
  );
}
