'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Music2, Eye, EyeOff, Loader2, ArrowRight, Crown } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

const royalInput = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(124,58,237,0.2)',
  caretColor: '#a855f7',
};

export default function SignupPage() {
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const data = await fetchApi('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, username, password }),
      });
      setSuccess(true);
      login(data.user, data.access_token);
      setTimeout(() => { window.location.href = '/'; }, 1500);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const focusStyle = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.border = '1px solid rgba(168,85,247,0.6)';
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)';
  };
  const blurStyle = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.border = '1px solid rgba(124,58,237,0.2)';
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <div
      className="relative min-h-screen overflow-y-auto flex items-center justify-center px-4 py-8"
      style={{ background: 'linear-gradient(135deg, #060610 0%, #0a0520 40%, #060612 100%)' }}
    >
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[450px] h-[450px] rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full opacity-12 blur-3xl"
          style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md z-10"
      >
        <div
          className="rounded-3xl p-8 text-white"
          style={{
            background: 'linear-gradient(145deg, rgba(20,10,50,0.85) 0%, rgba(10,5,28,0.9) 100%)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(124,58,237,0.2)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 40px rgba(124,58,237,0.1)',
          }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-7">
            <motion.div
              animate={{ boxShadow: ['0 0 20px rgba(124,58,237,0.4)', '0 0 35px rgba(245,158,11,0.3)', '0 0 20px rgba(124,58,237,0.4)'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 40%, #f59e0b 100%)' }}
            >
              <Music2 className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-center" style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #e9d5ff 50%, #fbbf24 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              Join Aura Stream
            </h1>
            <p className="text-sm mt-1.5 text-center flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <Crown className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
              Your royal music experience awaits
            </p>
          </div>

          {/* Error */}
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl p-3.5 mb-5 text-sm"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}
            >
              ⚠ {error}
            </motion.div>
          )}

          {/* Success */}
          {success && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl p-3.5 mb-5 text-sm flex items-center gap-2"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#6ee7b7' }}
            >
              ✓ Account created! Redirecting…
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2"
                style={{ color: 'rgba(255,255,255,0.5)' }}>Email Address</label>
              <input id="signup-email" type="email" required autoComplete="email"
                placeholder="you@example.com" value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={focusStyle} onBlur={blurStyle}
                className="w-full rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-zinc-600 outline-none transition-all"
                style={royalInput}
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2"
                style={{ color: 'rgba(255,255,255,0.5)' }}>Username</label>
              <input id="signup-username" type="text" required autoComplete="username"
                placeholder="your_username" value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={focusStyle} onBlur={blurStyle}
                className="w-full rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-zinc-600 outline-none transition-all"
                style={royalInput}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2"
                style={{ color: 'rgba(255,255,255,0.5)' }}>Password</label>
              <div className="relative">
                <input id="signup-password" type={showPassword ? 'text' : 'password'} required
                  autoComplete="new-password" placeholder="••••••••" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={focusStyle} onBlur={blurStyle}
                  className="w-full rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-zinc-600 outline-none transition-all pr-11"
                  style={royalInput}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer transition-colors"
                  style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button id="signup-submit" type="submit" disabled={loading || success}
              whileTap={{ scale: 0.97 }}
              className="w-full rounded-xl py-3.5 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-1"
              style={{
                background: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 45%, #f59e0b 100%)',
                boxShadow: '0 4px 24px rgba(124,58,237,0.45)',
                color: '#fff',
              }}
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <> Create Account <ArrowRight className="w-4 h-4" /> </>
              }
            </motion.button>
          </form>

          <div className="mt-6 text-center text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Already have an account?{' '}
            <Link href="/login" className="font-semibold"
              style={{
                background: 'linear-gradient(90deg, #a855f7, #f59e0b)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}
            >
              Log In
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
