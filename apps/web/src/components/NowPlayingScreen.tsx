'use client';

import React, { useRef, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import {
  ChevronDown, Heart, SkipBack, Play, Pause, SkipForward,
  Shuffle, Repeat, Volume2, VolumeX, ListMusic, Loader2,
  MoreHorizontal, Share2, PlusCircle
} from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface NowPlayingScreenProps {
  isLiked?: boolean;
  onToggleLike?: () => void;
  onAddToPlaylist?: () => void;
}

export default function NowPlayingScreen({
  isLiked = false,
  onToggleLike,
  onAddToPlaylist,
}: NowPlayingScreenProps) {
  const {
    currentTrack,
    isPlaying,
    isBuffering,
    isNowPlayingOpen,
    currentTime,
    duration,
    volume,
    isMuted,
    queue,
    queueIndex,
    togglePlay,
    nextTrack,
    prevTrack,
    seekTo,
    setVolume,
    toggleMute,
    setNowPlayingOpen,
  } = usePlayerStore();

  const progressRef = useRef<HTMLDivElement>(null);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    seekTo(pct * duration);
  }, [duration, seekTo]);

  const handleProgressTouch = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    seekTo(pct * duration);
  }, [duration, seekTo]);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    // Swipe down to close
    if (info.offset.y > 100 && info.velocity.y > 0) {
      setNowPlayingOpen(false);
    }
  }, [setNowPlayingOpen]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const albumArt = currentTrack?.thumbnailUrl || 'https://img.youtube.com/vi/default/mqdefault.jpg';
  const hqArt = currentTrack?.youtubeId
    ? `https://img.youtube.com/vi/${currentTrack.youtubeId}/maxresdefault.jpg`
    : albumArt;

  const nextSong = queue[queueIndex + 1] ?? queue[0];

  return (
    <AnimatePresence>
      {isNowPlayingOpen && (
        <motion.div
          key="now-playing"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.4 }}
          onDragEnd={handleDragEnd}
          className="now-playing-screen fixed inset-0 z-[100] flex flex-col overflow-hidden touch-none"
          style={{ willChange: 'transform' }}
        >
          {/* Blurred background */}
          <div className="absolute inset-0">
            <img
              src={hqArt}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = albumArt; }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/80 to-black/95 backdrop-blur-[60px]" />
          </div>

          {/* Content */}
          <div className="relative flex flex-col h-full px-6 pt-4 pb-8 select-none">

            {/* Top bar */}
            <div className="flex items-center justify-between mb-6">
              <button
                id="minimize-player-btn"
                aria-label="Minimize player"
                onClick={() => setNowPlayingOpen(false)}
                className="w-10 h-10 flex items-center justify-center text-white/80 active:text-white active:scale-90 transition-transform cursor-pointer"
              >
                <ChevronDown className="w-6 h-6" />
              </button>

              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/60">Now Playing</p>
                {queue.length > 1 && (
                  <p className="text-[10px] text-white/40 mt-0.5">
                    {queueIndex + 1} / {queue.length}
                  </p>
                )}
              </div>

              <button
                onClick={onAddToPlaylist}
                className="w-10 h-10 flex items-center justify-center text-white/80 active:text-white active:scale-90 transition-transform cursor-pointer"
              >
                <MoreHorizontal className="w-6 h-6" />
              </button>
            </div>

            {/* Album Art */}
            <div className="flex-1 flex items-center justify-center min-h-0 mb-6">
              <motion.div
                animate={{ scale: isPlaying && !isBuffering ? 1 : 0.88 }}
                transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                className="w-full max-w-[320px] aspect-square relative"
              >
                <img
                  src={hqArt}
                  alt={currentTrack?.title || 'Album Art'}
                  className="w-full h-full object-cover rounded-2xl shadow-2xl shadow-black/60"
                  onError={(e) => { (e.target as HTMLImageElement).src = albumArt; }}
                />
                {isBuffering && (
                  <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                  </div>
                )}
              </motion.div>
            </div>

            {/* Track Info + Like */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex-1 min-w-0 pr-4">
                <h2 className="text-white font-bold text-xl leading-tight truncate">
                  {currentTrack?.title || 'No Track Selected'}
                </h2>
                <p className="text-white/60 text-sm mt-1 truncate">
                  {currentTrack?.artistName || '—'}
                </p>
              </div>
              <button
                id="now-playing-like-btn"
                aria-label={isLiked ? "Unlike song" : "Like song"}
                onClick={onToggleLike}
                className={`flex-shrink-0 w-10 h-10 flex items-center justify-center transition-transform active:scale-90 ${isLiked ? 'text-pink-500' : 'text-white/50'}`}
              >
                <Heart className={`w-6 h-6 ${isLiked ? 'fill-pink-500' : ''}`} />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div
                ref={progressRef}
                className="relative h-1 bg-white/20 rounded-full cursor-pointer group mb-2"
                onClick={handleProgressClick}
                onTouchMove={handleProgressTouch}
                onTouchStart={handleProgressTouch}
              >
                <div
                  className="absolute left-0 top-0 h-full bg-white rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
                {/* Thumb */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg"
                  style={{ left: `calc(${progress}% - 7px)` }}
                />
              </div>
              <div className="flex justify-between text-xs text-white/50">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration || currentTrack?.durationSeconds || 0)}</span>
              </div>
            </div>

            {/* Main Controls */}
            <div className="flex items-center justify-between mb-6">
              <button className="w-10 h-10 flex items-center justify-center text-white/40 active:text-white transition-colors">
                <Shuffle className="w-5 h-5" />
              </button>

              <button
                id="now-playing-prev-btn"
                aria-label="Previous track"
                onClick={prevTrack}
                className="w-14 h-14 flex items-center justify-center text-white active:scale-90 transition-transform"
              >
                <SkipBack className="w-8 h-8 fill-white" />
              </button>

              <button
                id="now-playing-play-btn"
                aria-label={isPlaying ? "Pause music" : "Play music"}
                onClick={togglePlay}
                disabled={!currentTrack}
                className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-2xl shadow-black/50 active:scale-95 transition-transform disabled:opacity-70"
              >
                {isBuffering
                  ? <Loader2 className="w-7 h-7 text-black animate-spin" />
                  : isPlaying
                    ? <Pause className="w-7 h-7 fill-black text-black" />
                    : <Play className="w-7 h-7 fill-black text-black translate-x-0.5" />}
              </button>

              <button
                id="now-playing-next-btn"
                aria-label="Next track"
                onClick={nextTrack}
                className="w-14 h-14 flex items-center justify-center text-white active:scale-90 transition-transform"
              >
                <SkipForward className="w-8 h-8 fill-white" />
              </button>

              <button className="w-10 h-10 flex items-center justify-center text-white/40 active:text-white transition-colors">
                <Repeat className="w-5 h-5" />
              </button>
            </div>

            {/* Volume Slider */}
            <div className="hidden md:flex items-center gap-3 mb-6">
              <button onClick={toggleMute} className="text-white/50 active:text-white transition-colors">
                <VolumeX className="w-4 h-4" />
              </button>
              <div className="flex-1 relative h-1 bg-white/20 rounded-full">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div
                  className="h-full bg-white/70 rounded-full"
                  style={{ width: `${isMuted ? 0 : volume}%` }}
                />
              </div>
              <button onClick={() => setVolume(100)} className="text-white/50 active:text-white transition-colors">
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            {/* Up Next */}
            {nextSong && (
              <div className="hidden md:block border-t border-white/10 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-2">Up Next</p>
                <div className="flex items-center gap-3">
                  <img
                    src={nextSong.thumbnailUrl}
                    alt={nextSong.title}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-sm font-semibold truncate">{nextSong.title}</p>
                    <p className="text-white/50 text-xs truncate">{nextSong.artistName}</p>
                  </div>
                  <button
                    onClick={nextTrack}
                    className="text-white/40 active:text-white transition-colors"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
