'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Music2, Eye, EyeOff, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      });
      login(data.user, data.access_token);
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden flex items-center justify-center px-4 py-8"
      style={{
        background: 'linear-gradient(135deg, #060610 0%, #0a0520 40%, #060612 100%)',
      }}
    >
      {/* Royal ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-8 blur-3xl"
          style={{ background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)' }} />
      </div>

      {/* Floating music notes decorations */}
      <div className="fixed inset-0 pointer-events-none">
        {['♪', '♫', '♩', '♬'].map((note, i) => (
          <div key={i}
            className="absolute text-2xl opacity-5 select-none"
            style={{
              left: `${20 + i * 20}%`,
              top: `${15 + i * 18}%`,
              color: i % 2 === 0 ? '#a855f7' : '#f59e0b',
              fontSize: `${1.5 + i * 0.3}rem`,
            }}
          >{note}</div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md z-10"
      >
        {/* Card */}
        <div
          className="rounded-3xl p-8 text-white"
          style={{
            background: 'linear-gradient(145deg, rgba(20,10,50,0.85) 0%, rgba(10,5,28,0.9) 100%)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(124,58,237,0.2)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 40px rgba(124,58,237,0.1), 0 0 0 1px rgba(255,200,50,0.04) inset',
          }}
        >
          {/* Logo + Title */}
          <div className="flex flex-col items-center mb-8">
            <motion.div
              animate={{ boxShadow: ['0 0 20px rgba(124,58,237,0.4)', '0 0 35px rgba(245,158,11,0.3)', '0 0 20px rgba(124,58,237,0.4)'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{
                background: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 40%, #f59e0b 100%)',
                boxShadow: '0 8px 32px rgba(124,58,237,0.5)',
              }}
            >
              <Music2 className="w-8 h-8 text-white" />
            </motion.div>

            <div className="text-center">
              <h1 className="text-3xl font-bold" style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #e9d5ff 50%, #fbbf24 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Welcome Back
              </h1>
              <p className="text-sm mt-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Sign in to your Aura Stream account
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl p-3.5 mb-5 text-sm flex items-center gap-2"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: '#fca5a5',
              }}
            >
              <span className="text-red-400">⚠</span> {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email / Username */}
            <div>
              <label
                htmlFor="login-identifier"
                className="block text-xs font-bold uppercase tracking-widest mb-2"
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                Username or Email
              </label>
              <input
                id="login-identifier"
                type="text"
                required
                autoComplete="username"
                placeholder="you@example.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-zinc-600 transition-all outline-none"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(124,58,237,0.2)',
                  caretColor: '#a855f7',
                }}
                onFocus={e => {
                  e.currentTarget.style.border = '1px solid rgba(168,85,247,0.6)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)';
                }}
                onBlur={e => {
                  e.currentTarget.style.border = '1px solid rgba(124,58,237,0.2)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-bold uppercase tracking-widest mb-2"
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-zinc-600 transition-all outline-none pr-11"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(124,58,237,0.2)',
                    caretColor: '#a855f7',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.border = '1px solid rgba(168,85,247,0.6)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)';
                  }}
                  onBlur={e => {
                    e.currentTarget.style.border = '1px solid rgba(124,58,237,0.2)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
                  style={{ color: 'rgba(255,255,255,0.35)' }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              id="login-submit"
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.97 }}
              className="w-full rounded-xl py-3.5 text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              style={{
                background: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 45%, #f59e0b 100%)',
                boxShadow: '0 4px 24px rgba(124,58,237,0.45), 0 0 0 1px rgba(255,200,50,0.1) inset',
                color: '#fff',
              }}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Log In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Sign Up link */}
          <div className="mt-6 text-center text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="font-semibold transition-colors hover:opacity-80"
              style={{
                background: 'linear-gradient(90deg, #a855f7, #f59e0b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Sign Up
            </Link>
          </div>

          {/* Demo hint */}
          <div className="mt-4 pt-4 flex items-center gap-2 justify-center"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
          >
            <Sparkles className="w-3 h-3" style={{ color: '#f59e0b' }} />
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Demo: demo@aurastream.com / password123
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
