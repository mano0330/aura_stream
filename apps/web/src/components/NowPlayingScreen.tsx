'use client';

import React, { useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import {
  ChevronDown, Heart, SkipBack, Play, Pause, SkipForward,
  Shuffle, Repeat, Volume2, VolumeX, ListMusic, Loader2,
  MoreHorizontal, Disc3, Music2, Repeat1
} from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Get highest quality YouTube thumbnail with fallback chain
function getHQThumbnail(youtubeId?: string, fallback?: string): string {
  if (!youtubeId) return fallback || '/placeholder-album.png';
  return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
}
function getMQThumbnail(youtubeId?: string, fallback?: string): string {
  if (!youtubeId) return fallback || '/placeholder-album.png';
  return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
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
  const [imgError, setImgError] = useState(false);
  const [shuffleOn, setShuffleOn] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');

  const hqArt = getHQThumbnail(currentTrack?.youtubeId, currentTrack?.thumbnailUrl);
  const mqArt = getMQThumbnail(currentTrack?.youtubeId, currentTrack?.thumbnailUrl);
  const displayArt = imgError ? mqArt : hqArt;

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
    if (info.offset.y > 100 && info.velocity.y > 0) setNowPlayingOpen(false);
  }, [setNowPlayingOpen]);

  const cycleRepeat = () => {
    setRepeatMode(prev => prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off');
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const nextSong = queue[queueIndex + 1] ?? null;

  return (
    <AnimatePresence>
      {isNowPlayingOpen && (
        <motion.div
          key="now-playing"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 32, stiffness: 320 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.4 }}
          onDragEnd={handleDragEnd}
          className="now-playing-screen fixed inset-0 z-[100] flex flex-col overflow-hidden touch-none"
          style={{ willChange: 'transform' }}
        >
          {/* ── Full blurred background ── */}
          <div className="absolute inset-0">
            <img
              src={displayArt}
              alt=""
              className="w-full h-full object-cover scale-110"
              onError={() => setImgError(true)}
            />
            {/* Royal layered gradient overlay */}
            <div className="absolute inset-0"
              style={{
                background: 'linear-gradient(180deg, rgba(10,4,30,0.72) 0%, rgba(6,3,18,0.88) 45%, rgba(4,2,12,0.97) 100%)',
              }}
            />
            {/* Purple ambient orb */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-20 blur-3xl"
              style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }}
            />
          </div>

          {/* ── Content ── */}
          <div className="relative flex flex-col h-full px-6 pt-safe pb-8 select-none" style={{ paddingTop: 'max(16px, env(safe-area-inset-top))' }}>

            {/* Top bar — drag handle + controls */}
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => setNowPlayingOpen(false)}
                className="w-11 h-11 flex items-center justify-center text-white/70 active:text-white active:scale-90 transition-all cursor-pointer"
              >
                <ChevronDown className="w-6 h-6" />
              </button>

              <div className="flex flex-col items-center">
                {/* Pill drag handle */}
                <div className="w-10 h-1 rounded-full bg-white/20 mb-2" />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Now Playing</p>
                {queue.length > 1 && (
                  <p className="text-[9px] text-white/30 mt-0.5">{queueIndex + 1} / {queue.length}</p>
                )}
              </div>

              <button
                onClick={onAddToPlaylist}
                className="w-11 h-11 flex items-center justify-center text-white/70 active:text-white active:scale-90 transition-all cursor-pointer"
              >
                <MoreHorizontal className="w-6 h-6" />
              </button>
            </div>

            {/* ── Album Art ── */}
            <div className="flex-1 flex items-center justify-center min-h-0 mb-6">
              <motion.div
                animate={{
                  scale: isPlaying && !isBuffering ? 1 : 0.85,
                  rotate: isPlaying && !isBuffering ? [0, 0] : 0,
                }}
                transition={{ type: 'spring', damping: 18, stiffness: 180 }}
                className="w-full max-w-[300px] sm:max-w-[340px] aspect-square relative"
              >
                {/* Glow ring behind art */}
                <div
                  className="absolute inset-0 rounded-3xl blur-2xl opacity-50 scale-95"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #f59e0b)' }}
                />
                <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl"
                  style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 40px rgba(124,58,237,0.3)' }}
                >
                  <img
                    src={displayArt}
                    alt={currentTrack?.title || 'Album Art'}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                  />
                  {/* Vinyl shine overlay */}
                  <div className="absolute inset-0 rounded-3xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 60%)',
                      pointerEvents: 'none',
                    }}
                  />
                  {isBuffering && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-3xl">
                      <Loader2 className="w-10 h-10 animate-spin" style={{ color: '#f59e0b' }} />
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* ── Track Info + Like ── */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex-1 min-w-0 pr-4">
                <h2 className="text-white font-bold text-xl leading-tight truncate">
                  {currentTrack?.title || 'No Track Selected'}
                </h2>
                <p className="text-white/50 text-sm mt-1 truncate">
                  {currentTrack?.artistName || '—'}
                </p>
              </div>
              <motion.button
                id="now-playing-like-btn"
                whileTap={{ scale: 0.8 }}
                onClick={onToggleLike}
                className="w-12 h-12 flex items-center justify-center rounded-full transition-all cursor-pointer"
                style={{
                  background: isLiked ? 'rgba(244,63,94,0.15)' : 'rgba(255,255,255,0.05)',
                  border: isLiked ? '1px solid rgba(244,63,94,0.4)' : '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <Heart
                  className="w-5 h-5 transition-all"
                  style={{
                    color: isLiked ? '#f43f5e' : 'rgba(255,255,255,0.5)',
                    fill: isLiked ? '#f43f5e' : 'transparent',
                    filter: isLiked ? 'drop-shadow(0 0 6px rgba(244,63,94,0.6))' : 'none',
                  }}
                />
              </motion.button>
            </div>

            {/* ── Progress Bar ── */}
            <div className="mb-5">
              <div
                ref={progressRef}
                className="relative h-1.5 rounded-full cursor-pointer mb-2.5 group"
                style={{ background: 'rgba(255,255,255,0.12)' }}
                onClick={handleProgressClick}
                onTouchMove={handleProgressTouch}
                onTouchStart={handleProgressTouch}
              >
                {/* Filled track */}
                <div
                  className="absolute left-0 top-0 h-full rounded-full transition-all duration-100"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #7c3aed, #a855f7, #f59e0b)',
                  }}
                />
                {/* Scrubber thumb */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-lg transition-all duration-100 group-hover:scale-110"
                  style={{
                    left: `calc(${progress}% - 8px)`,
                    background: 'linear-gradient(135deg, #a855f7, #f59e0b)',
                    boxShadow: '0 0 8px rgba(168,85,247,0.6)',
                  }}
                />
              </div>
              <div className="flex justify-between text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration || currentTrack?.durationSeconds || 0)}</span>
              </div>
            </div>

            {/* ── Main Controls ── */}
            <div className="flex items-center justify-between mb-6">
              {/* Shuffle */}
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => setShuffleOn(!shuffleOn)}
                className="w-11 h-11 flex items-center justify-center rounded-xl transition-all cursor-pointer"
                style={{
                  color: shuffleOn ? '#a855f7' : 'rgba(255,255,255,0.35)',
                  background: shuffleOn ? 'rgba(168,85,247,0.15)' : 'transparent',
                }}
              >
                <Shuffle className="w-5 h-5" />
              </motion.button>

              {/* Prev */}
              <motion.button
                id="now-playing-prev-btn"
                whileTap={{ scale: 0.88 }}
                onClick={prevTrack}
                className="w-14 h-14 flex items-center justify-center text-white cursor-pointer"
              >
                <SkipBack className="w-8 h-8 fill-white" />
              </motion.button>

              {/* Play/Pause — main royal button */}
              <motion.button
                id="now-playing-play-btn"
                whileTap={{ scale: 0.92 }}
                onClick={togglePlay}
                disabled={!currentTrack}
                className="w-18 h-18 rounded-full flex items-center justify-center cursor-pointer disabled:opacity-50"
                style={{
                  width: 68, height: 68,
                  background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #f59e0b 100%)',
                  boxShadow: '0 0 30px rgba(168,85,247,0.5), 0 8px 24px rgba(0,0,0,0.5)',
                }}
              >
                {isBuffering
                  ? <Loader2 className="w-7 h-7 text-white animate-spin" />
                  : isPlaying
                    ? <Pause className="w-7 h-7 fill-white text-white" />
                    : <Play className="w-7 h-7 fill-white text-white translate-x-0.5" />
                }
              </motion.button>

              {/* Next */}
              <motion.button
                id="now-playing-next-btn"
                whileTap={{ scale: 0.88 }}
                onClick={nextTrack}
                className="w-14 h-14 flex items-center justify-center text-white cursor-pointer"
              >
                <SkipForward className="w-8 h-8 fill-white" />
              </motion.button>

              {/* Repeat */}
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={cycleRepeat}
                className="w-11 h-11 flex items-center justify-center rounded-xl transition-all cursor-pointer"
                style={{
                  color: repeatMode !== 'off' ? '#f59e0b' : 'rgba(255,255,255,0.35)',
                  background: repeatMode !== 'off' ? 'rgba(245,158,11,0.12)' : 'transparent',
                }}
              >
                {repeatMode === 'one'
                  ? <Repeat1 className="w-5 h-5" />
                  : <Repeat className="w-5 h-5" />
                }
              </motion.button>
            </div>

            {/* ── Volume (desktop) ── */}
            <div className="hidden sm:flex items-center gap-3 mb-5">
              <button onClick={toggleMute} className="text-white/40 hover:text-white/70 transition-colors cursor-pointer">
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <div className="flex-1 relative h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <input
                  type="range" min={0} max={100}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div
                  className="h-full rounded-full pointer-events-none"
                  style={{
                    width: `${isMuted ? 0 : volume}%`,
                    background: 'linear-gradient(90deg, #7c3aed, #f59e0b)',
                  }}
                />
              </div>
              <Volume2 className="w-4 h-4 text-white/40" />
            </div>

            {/* ── Up Next ── */}
            {nextSong && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl px-4 py-3 flex items-center gap-3"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="shrink-0">
                  <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider mb-1">Up Next</p>
                  <img
                    src={getMQThumbnail(nextSong.youtubeId, nextSong.thumbnailUrl)}
                    alt={nextSong.title}
                    className="w-10 h-10 rounded-xl object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = nextSong.thumbnailUrl || ''; }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{nextSong.title}</p>
                  <p className="text-white/40 text-xs truncate">{nextSong.artistName}</p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={nextTrack}
                  className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer"
                  style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)' }}
                >
                  <SkipForward className="w-4 h-4 text-accent" />
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
