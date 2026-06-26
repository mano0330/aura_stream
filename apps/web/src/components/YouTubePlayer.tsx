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
  const endedDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHandlingEndRef = useRef(false); // prevent double-fire

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
    toggleStreamVisible,
  } = usePlayerStore();

  // ── Load YouTube IFrame API once ──────────────────────────────────────
  useEffect(() => {
    setMounted(true);

    const loadAPI = () => {
      if (window.YT && window.YT.Player) { setApiReady(true); return; }
      if (window.onYouTubeIframeAPIReady) {
        const orig = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => { orig(); setApiReady(true); };
        return;
      }
      window.onYouTubeIframeAPIReady = () => setApiReady(true);
      if (!document.getElementById('yt-api-script')) {
        const tag = document.createElement('script');
        tag.id = 'yt-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
    };

    loadAPI();
    return () => { if (timeUpdateInterval.current) clearInterval(timeUpdateInterval.current); };
  }, []);

  useEffect(() => { if (apiReady) initPlayer(); }, [apiReady]);

  const timeUpdateInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleEnded = () => {
    // Debounce: only fire once per end event
    if (isHandlingEndRef.current) return;
    isHandlingEndRef.current = true;

    if (endedDebounceRef.current) clearTimeout(endedDebounceRef.current);
    endedDebounceRef.current = setTimeout(() => {
      // Get fresh store state to call nextTrack
      usePlayerStore.getState().nextTrack();
      // Reset flag after a second so future ends work
      setTimeout(() => { isHandlingEndRef.current = false; }, 1000);
    }, 300);
  };

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
        loop: 0,             // ✅ Prevent YouTube auto-loop
        origin: typeof window !== 'undefined' ? window.location.origin : '',
      },
      events: {
        onReady: (event: any) => {
          setYoutubePlayer(event.target);
          event.target.setVolume(volume);
          if (isMuted) event.target.mute();

          const { currentTrack: ct, isPlaying: ip } = usePlayerStore.getState();
          if (ct) {
            loadedVideoIdRef.current = ct.youtubeId;
            if (ip) event.target.loadVideoById(ct.youtubeId);
            else event.target.cueVideoById(ct.youtubeId);
          }
        },
        onStateChange: (event: any) => {
          const state = event.data;
          if (state === window.YT.PlayerState.PLAYING) {       // 1
            isHandlingEndRef.current = false; // reset on new play
            setBuffering(false);
            setPlaying(true);
            setDuration(event.target.getDuration());
            startTrackingTime();
          } else if (state === window.YT.PlayerState.PAUSED) { // 2
            setBuffering(false);
            setPlaying(false);
            stopTrackingTime();
          } else if (state === window.YT.PlayerState.ENDED) {  // 0 ✅ Fixed
            setBuffering(false);
            setPlaying(false);
            stopTrackingTime();
            handleEnded();   // debounced, deduplicated
          } else if (state === window.YT.PlayerState.BUFFERING) { // 3
            setBuffering(true);
          } else if (state === window.YT.PlayerState.CUED) {   // 5
            setBuffering(false);
          }
        },
        onError: (event: any) => {
          console.warn('YouTube player error:', event.data);
          setBuffering(false);
          // On error skip to next after short delay
          setTimeout(() => { usePlayerStore.getState().nextTrack(); }, 1500);
        },
      },
    });
  };

  // ── Sync track changes to player ────────────────────────────────────
  useEffect(() => {
    if (!youtubePlayer || !currentTrack) return;
    if (loadedVideoIdRef.current !== currentTrack.youtubeId) {
      loadedVideoIdRef.current = currentTrack.youtubeId;
      isHandlingEndRef.current = false; // reset for new track
      setBuffering(true);
      // Always load (not cue) so it autoplays
      try { youtubePlayer.loadVideoById(currentTrack.youtubeId); } catch (e) { /* ignore */ }
    }
  }, [currentTrack, youtubePlayer]);

  // ── Sync play/pause ──────────────────────────────────────────────────
  useEffect(() => {
    if (!youtubePlayer || !currentTrack) return;
    try {
      const playerState = youtubePlayer.getPlayerState();
      // Don't interfere while loading new track (ENDED=0, will be replaced)
      if (playerState === 0) return;
      if (isPlaying && playerState !== 1 && playerState !== 3) {
        setBuffering(true);
        youtubePlayer.playVideo();
      } else if (!isPlaying && playerState === 1) {
        youtubePlayer.pauseVideo();
      }
    } catch (e) { /* Player not ready */ }
  }, [isPlaying, youtubePlayer, currentTrack]);

  const startTrackingTime = () => {
    if (timeUpdateInterval.current) clearInterval(timeUpdateInterval.current);
    timeUpdateInterval.current = setInterval(() => {
      try {
        if (playerRef.current?.getCurrentTime) {
          setCurrentTime(playerRef.current.getCurrentTime());
        }
      } catch (e) { /* ignore */ }
    }, 500);
  };

  const stopTrackingTime = () => {
    if (timeUpdateInterval.current) { clearInterval(timeUpdateInterval.current); timeUpdateInterval.current = null; }
  };

  useEffect(() => {
    if (playerRef.current?.setVolume) {
      try { playerRef.current.setVolume(volume); } catch (e) { /* ignore */ }
    }
  }, [volume]);

  useEffect(() => {
    if (playerRef.current?.mute) {
      try {
        if (isMuted) playerRef.current.mute();
        else playerRef.current.unMute();
      } catch (e) { /* ignore */ }
    }
  }, [isMuted]);

  if (!mounted) return null;

  return (
    <div
      className="fixed bottom-28 transition-all duration-300 rounded-xl overflow-hidden shadow-2xl border border-gold/20 z-30 w-80 h-48"
      style={{
        right: isStreamVisible ? '32px' : 'auto',
        left: isStreamVisible ? 'auto' : '-9999px',
        opacity: isStreamVisible ? 1 : 0,
        transform: isStreamVisible ? 'scale(1)' : 'scale(0.95)',
        pointerEvents: isStreamVisible ? 'auto' : 'none',
        background: 'rgba(8, 4, 20, 0.85)',
        backdropFilter: 'blur(24px)',
      }}
    >
      <div className="px-3 py-2 flex items-center justify-between border-b border-white/5"
        style={{ background: 'linear-gradient(90deg, rgba(91,33,182,0.3), rgba(180,130,0,0.15))' }}
      >
        <span className="text-[10px] font-bold text-amber-300/80 uppercase tracking-widest flex items-center gap-1.5">
          <Tv className="w-3.5 h-3.5 text-amber-400" />
          {isBuffering ? 'Buffering…' : 'Live Stream'}
        </span>
        <button
          onClick={toggleStreamVisible}
          className="p-1 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <Minimize2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div ref={containerRef} className="w-full h-[calc(100%-36px)] bg-black relative">
        <div id="yt-iframe-container" className="w-full h-full" />
        {isBuffering && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          </div>
        )}
      </div>
    </div>
  );
}
