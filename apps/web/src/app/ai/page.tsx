'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Send, Loader2, Play, Pause, Music, Radio,
  ListMusic, ArrowLeft, Bot, User, Wand2, Mic, RefreshCw
} from 'lucide-react';
import { usePlayerStore, Track } from '@/store/playerStore';
import { useAuthStore } from '@/store/authStore';
import { fetchApi } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface GeneratedPlaylist {
  playlistTitle: string;
  description: string;
  tracks: Track[];
}

const SUGGESTED_PROMPTS = [
  'Create a late-night coding playlist with synthwave and ambient vibes',
  'Give me a high-energy workout mix with EDM and hip-hop',
  'Make a Sunday morning jazz and acoustic playlist',
  'Songs similar to the Interstellar soundtrack for deep focus',
  'Create a happy road trip playlist from the 2000s',
  'Relaxing lofi beats for studying and concentration',
];

export default function AIDJPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const { playTrack, setQueue, currentTrack, isPlaying } = usePlayerStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/login';
    }
  }, [isLoading, isAuthenticated]);

  // ─── Playlist Generator State ───
  const [activeTab, setActiveTab] = useState<'generator' | 'dj-chat' | 'nl-search'>('generator');
  const [generatorPrompt, setGeneratorPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedPlaylist, setGeneratedPlaylist] = useState<GeneratedPlaylist | null>(null);
  const [savingPlaylist, setSavingPlaylist] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  // ─── DJ Chat State ───
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hey there! I'm Aura, your personal AI DJ. Ask me anything about music — I can recommend tracks, explain music history, or create a playlist tailored just for you. What are you in the mood for?",
      timestamp: new Date(),
    }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ─── NL Search State ───
  const [nlQuery, setNlQuery] = useState('');
  const [nlSearching, setNlSearching] = useState(false);
  const [nlResults, setNlResults] = useState<Track[]>([]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ─── Playlist Generator ───
  const handleGeneratePlaylist = async (prompt?: string) => {
    const activePrompt = prompt || generatorPrompt;
    if (!activePrompt.trim()) return;

    setGenerating(true);
    setGeneratedPlaylist(null);
    setGeneratorPrompt(activePrompt);

    try {
      const data = await fetchApi('/ai/playlist', {
        method: 'POST',
        body: JSON.stringify({ prompt: activePrompt }),
      });
      setGeneratedPlaylist(data);
    } catch (err: any) {
      alert(err.message || 'AI playlist generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handlePlayGeneratedPlaylist = () => {
    if (!generatedPlaylist?.tracks?.length) return;
    setQueue(generatedPlaylist.tracks, 0);
  };

  const handleSavePlaylist = async () => {
    if (!isAuthenticated) {
      alert('Please log in to save playlists');
      return;
    }
    if (!generatedPlaylist) return;

    setSavingPlaylist(true);
    try {
      const playlist = await fetchApi('/playlists', {
        method: 'POST',
        body: JSON.stringify({
          title: generatedPlaylist.playlistTitle,
          description: generatedPlaylist.description,
        }),
      });

      for (const track of generatedPlaylist.tracks) {
        await fetchApi(`/playlists/${playlist.id}/songs`, {
          method: 'POST',
          body: JSON.stringify({
            youtubeId: track.youtubeId,
            title: track.title,
            artistName: track.artistName,
            durationSeconds: track.durationSeconds,
            thumbnailUrl: track.thumbnailUrl,
          }),
        });
      }

      setSavedMessage(`✓ Saved "${generatedPlaylist.playlistTitle}" to your library!`);
      setTimeout(() => setSavedMessage(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to save playlist');
    } finally {
      setSavingPlaylist(false);
    }
  };

  // ─── DJ Chat ───
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: chatInput, timestamp: new Date() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const history = chatMessages.map(m => ({ role: m.role, content: m.content }));
      const data = await fetchApi('/ai/dj/chat', {
        method: 'POST',
        body: JSON.stringify({ message: chatInput, history }),
      });

      const aiMsg: ChatMessage = { role: 'assistant', content: data.reply, timestamp: new Date() };
      setChatMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errMsg: ChatMessage = {
        role: 'assistant',
        content: "I hit a static patch. Could you try that again?",
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, errMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleDJIntro = async () => {
    if (!currentTrack) {
      alert('Play a track first to get an AI DJ intro!');
      return;
    }
    setChatLoading(true);
    try {
      const data = await fetchApi('/ai/dj/intro', {
        method: 'POST',
        body: JSON.stringify({ currentTrack: { title: currentTrack.title, artistName: currentTrack.artistName } }),
      });
      const aiMsg: ChatMessage = {
        role: 'assistant',
        content: `🎙️ ${data.intro}`,
        timestamp: new Date(),
      };
      setActiveTab('dj-chat');
      setChatMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  // ─── Natural Language Search ───
  const handleNLSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlQuery.trim()) return;

    setNlSearching(true);
    setNlResults([]);
    try {
      const data = await fetchApi(`/ai/search?q=${encodeURIComponent(nlQuery)}`);
      setNlResults(data);
    } catch (err: any) {
      alert(err.message || 'AI search failed');
    } finally {
      setNlSearching(false);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#07070a] flex items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#07070a] text-white py-12 px-4 md:px-8 pb-32">
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-purple-600/8 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-pink-600/8 blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-white via-purple-200 to-pink-400 bg-clip-text text-transparent">
                AI Studio
              </h1>
            </div>
            <p className="text-zinc-400 text-sm">Generate playlists, search with natural language, and chat with your AI DJ.</p>
          </div>

          {currentTrack && (
            <button
              onClick={handleDJIntro}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-500/30 hover:border-purple-400/50 px-4 py-2.5 rounded-full text-sm font-semibold transition-all cursor-pointer"
            >
              <Mic className="w-4 h-4 text-purple-400" />
              AI DJ Intro for &quot;{currentTrack.title}&quot;
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 p-1.5 glass rounded-2xl w-fit">
          {[
            { id: 'generator', label: 'Playlist Generator', icon: Wand2 },
            { id: 'dj-chat', label: 'AI DJ Chat', icon: Bot },
            { id: 'nl-search', label: 'Smart Search', icon: Sparkles },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/20'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ═══════════════════════════ PLAYLIST GENERATOR ═══════════════════════════ */}
        {activeTab === 'generator' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left: Prompt input */}
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card rounded-2xl p-6">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-purple-400" /> Describe Your Vibe
                </h2>

                <textarea
                  value={generatorPrompt}
                  onChange={e => setGeneratorPrompt(e.target.value)}
                  placeholder="e.g. Create a late-night coding playlist with ambient synth and focus beats..."
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-zinc-500 resize-none mb-4"
                />

                <button
                  onClick={() => handleGeneratePlaylist()}
                  disabled={generating || !generatorPrompt.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {generating ? 'Generating...' : 'Generate Playlist'}
                </button>
              </div>

              {/* Suggested prompts */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-sm font-bold text-zinc-300 mb-3 uppercase tracking-wider">Quick Ideas</h3>
                <div className="space-y-2">
                  {SUGGESTED_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleGeneratePlaylist(prompt)}
                      disabled={generating}
                      className="w-full text-left px-3 py-2.5 rounded-lg bg-white/3 hover:bg-white/8 border border-white/5 hover:border-purple-500/30 text-zinc-300 hover:text-white text-xs leading-relaxed transition-all cursor-pointer disabled:opacity-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Generated playlist */}
            <div className="lg:col-span-3">
              {generating && (
                <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center text-center h-80">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 rounded-full bg-purple-600/20 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
                    </div>
                    <div className="absolute inset-0 rounded-full border-2 border-purple-500/30 animate-ping" />
                  </div>
                  <p className="text-zinc-300 font-semibold mb-1">AI is curating your playlist...</p>
                  <p className="text-zinc-500 text-xs">Searching across music to find the perfect tracks</p>
                </div>
              )}

              {!generating && !generatedPlaylist && (
                <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center text-center h-80 border-dashed">
                  <ListMusic className="w-12 h-12 text-zinc-600 mb-4" />
                  <p className="text-zinc-400 font-semibold mb-1">Your AI playlist will appear here</p>
                  <p className="text-zinc-600 text-xs">Describe what you want to hear on the left</p>
                </div>
              )}

              {generatedPlaylist && !generating && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card rounded-2xl overflow-hidden"
                >
                  {/* Playlist header */}
                  <div className="p-6 bg-gradient-to-r from-purple-900/30 to-pink-900/20 border-b border-white/5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-purple-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 mb-1">
                          <Sparkles className="w-3 h-3" /> AI Generated
                        </span>
                        <h2 className="text-xl font-extrabold mb-1">{generatedPlaylist.playlistTitle}</h2>
                        <p className="text-zinc-400 text-xs leading-relaxed">{generatedPlaylist.description}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={handlePlayGeneratedPlaylist}
                          disabled={!generatedPlaylist.tracks?.length}
                          className="bg-white text-black font-semibold px-4 py-2 rounded-full text-xs hover:scale-105 transition-transform flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Play className="w-3.5 h-3.5 fill-black" /> Play All
                        </button>
                        {isAuthenticated && (
                          <button
                            onClick={handleSavePlaylist}
                            disabled={savingPlaylist}
                            className="bg-purple-600/30 border border-purple-500/30 hover:bg-purple-600/50 text-purple-300 font-semibold px-4 py-2 rounded-full text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            {savingPlaylist ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ListMusic className="w-3.5 h-3.5" />}
                            Save
                          </button>
                        )}
                      </div>
                    </div>
                    {savedMessage && (
                      <p className="text-emerald-400 text-xs mt-3 font-semibold">{savedMessage}</p>
                    )}
                  </div>

                  {/* Track list */}
                  <div className="divide-y divide-white/5 max-h-[420px] overflow-y-auto">
                    {generatedPlaylist.tracks?.length === 0 && (
                      <div className="p-8 text-center text-zinc-500 text-sm">
                        No tracks found — try a more specific prompt or check your YouTube API key.
                      </div>
                    )}
                    {generatedPlaylist.tracks?.map((track, idx) => {
                      const isCurrent = currentTrack?.youtubeId === track.youtubeId;
                      return (
                        <div
                          key={track.youtubeId}
                          onClick={() => playTrack(track)}
                          className={`flex items-center gap-4 p-4 hover:bg-white/4 cursor-pointer group transition-colors ${isCurrent ? 'bg-purple-500/10' : ''}`}
                        >
                          <span className="text-zinc-600 text-xs w-5 text-right flex-shrink-0">{idx + 1}</span>
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0 relative">
                            <img src={track.thumbnailUrl} alt={track.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Play className="w-3.5 h-3.5 fill-white text-white" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold text-sm truncate ${isCurrent ? 'text-purple-400' : ''}`}>{track.title}</p>
                            <p className="text-zinc-500 text-xs truncate">{track.artistName}</p>
                          </div>
                          <span className="text-zinc-600 text-xs flex-shrink-0">{formatTime(track.durationSeconds)}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Regenerate */}
                  <div className="p-4 border-t border-white/5">
                    <button
                      onClick={() => handleGeneratePlaylist()}
                      disabled={generating}
                      className="w-full flex items-center justify-center gap-2 py-2 text-xs text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Regenerate with same prompt
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════ AI DJ CHAT ═══════════════════════════ */}
        {activeTab === 'dj-chat' && (
          <div className="max-w-3xl mx-auto">
            <div className="glass-card rounded-2xl overflow-hidden flex flex-col" style={{ height: '65vh' }}>
              {/* Chat header */}
              <div className="p-4 border-b border-white/5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Radio className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-sm">Aura AI DJ</p>
                  <p className="text-zinc-500 text-[10px]">Music expert · Always listening</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-400 text-[10px] font-semibold">Online</span>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence initial={false}>
                  {chatMessages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white ${
                        msg.role === 'assistant'
                          ? 'bg-gradient-to-tr from-purple-600 to-pink-500'
                          : 'bg-zinc-700'
                      }`}>
                        {msg.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>
                      <div className={`max-w-xs md:max-w-md rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.role === 'assistant'
                          ? 'bg-white/5 border border-white/8 text-zinc-100 rounded-tl-none'
                          : 'bg-gradient-to-r from-purple-600/40 to-pink-600/40 border border-purple-500/30 text-white rounded-tr-none'
                      }`}>
                        {msg.content}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {chatLoading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white/5 border border-white/8 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </motion.div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSendChat} className="p-4 border-t border-white/5 flex gap-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Ask Aura anything about music..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-all placeholder:text-zinc-500"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center shadow-lg cursor-pointer disabled:opacity-50 hover:scale-105 transition-transform"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ═══════════════════════════ NATURAL LANGUAGE SEARCH ═══════════════════════════ */}
        {activeTab === 'nl-search' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="glass-card rounded-2xl p-6">
              <h2 className="font-bold text-lg mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" /> Smart Music Search
              </h2>
              <p className="text-zinc-400 text-xs mb-5">
                Search using natural language — AI will understand your intent and find the right tracks.
              </p>

              <form onSubmit={handleNLSearch} className="flex gap-3">
                <input
                  type="text"
                  value={nlQuery}
                  onChange={e => setNlQuery(e.target.value)}
                  placeholder='e.g. "Songs like Interstellar" or "Happy indie songs from the 90s"'
                  className="flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-3 text-sm focus:outline-none focus:border-purple-500 transition-all placeholder:text-zinc-500"
                />
                <button
                  type="submit"
                  disabled={nlSearching || !nlQuery.trim()}
                  className="bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold px-6 py-3 rounded-full text-sm flex items-center gap-2 cursor-pointer disabled:opacity-60 hover:scale-105 transition-transform shadow-lg shadow-purple-500/20"
                >
                  {nlSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Search
                </button>
              </form>

              {/* Example queries */}
              <div className="flex flex-wrap gap-2 mt-4">
                {[
                  'Songs similar to Interstellar',
                  'Happy music from the 80s',
                  'Relaxing music for coding',
                  'Best workout songs',
                  'Sad indie songs late night',
                ].map(q => (
                  <button
                    key={q}
                    onClick={() => { setNlQuery(q); }}
                    className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-full hover:bg-purple-600/20 hover:border-purple-500/30 hover:text-purple-300 text-zinc-400 transition-all cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {nlSearching && (
              <div className="flex items-center justify-center py-16 text-zinc-500">
                <Loader2 className="w-6 h-6 animate-spin mr-3 text-purple-400" />
                AI is interpreting your search...
              </div>
            )}

            {nlResults.length > 0 && !nlSearching && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card rounded-2xl overflow-hidden"
              >
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    {nlResults.length} AI-curated results
                  </h3>
                  <button
                    onClick={() => setQueue(nlResults, 0)}
                    className="text-xs bg-white/5 border border-white/10 px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer font-semibold flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Play All
                  </button>
                </div>

                <div className="divide-y divide-white/5">
                  {nlResults.map((track, idx) => {
                    const isCurrent = currentTrack?.youtubeId === track.youtubeId;
                    return (
                      <div
                        key={track.youtubeId}
                        onClick={() => playTrack(track)}
                        className={`flex items-center gap-4 p-4 hover:bg-white/4 cursor-pointer group transition-colors ${isCurrent ? 'bg-purple-500/10' : ''}`}
                      >
                        <span className="text-zinc-600 text-xs w-5 text-right flex-shrink-0">{idx + 1}</span>
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0 relative">
                          <img src={track.thumbnailUrl} alt={track.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Play className="w-4 h-4 fill-white text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm truncate ${isCurrent ? 'text-purple-400' : ''}`}>{track.title}</p>
                          <p className="text-zinc-500 text-xs truncate mt-0.5">{track.artistName}</p>
                        </div>
                        <span className="text-zinc-600 text-xs flex-shrink-0">{formatTime(track.durationSeconds)}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
