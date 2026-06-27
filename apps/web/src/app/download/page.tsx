'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Smartphone, Download, ShieldCheck, ArrowLeft, 
  HelpCircle, Settings, CheckCircle2, QrCode, Loader2
} from 'lucide-react';

export default function DownloadPage() {
  const [qrUrl, setQrUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [siteUrl, setSiteUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      setSiteUrl(origin);
      setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=9333ea&data=${encodeURIComponent(origin + '/download')}`);
    }
  }, []);

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(siteUrl + '/download');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const steps = [
    {
      icon: Download,
      title: "1. Download the APK",
      desc: "Tap the download button below. Your browser might show a standard security warning — tap 'Download Anyway' to proceed.",
      color: "from-blue-500 to-indigo-500"
    },
    {
      icon: Settings,
      title: "2. Allow Installation",
      desc: "Go to Settings -> Apps -> Special access -> Install unknown apps. Select Chrome (or your browser) and toggle 'Allow from this source'.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: CheckCircle2,
      title: "3. Open and Enjoy",
      desc: "Once downloaded, tap the file in your downloads folder or notifications, select 'Install', and launch your new Spotify-like player!",
      color: "from-emerald-500 to-teal-500"
    }
  ];

  return (
    <div
      className="relative min-h-screen text-white flex flex-col items-center px-4 py-8 overflow-y-auto"
      style={{
        background: 'linear-gradient(135deg, #060610 0%, #0a0520 40%, #060612 100%)',
      }}
    >
      {/* Dynamic background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }} />
      </div>

      {/* Header / Navigation back */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-8 z-10">
        <Link 
          href="/" 
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all text-sm font-semibold border border-white/5"
        >
          <ArrowLeft className="w-4 h-4" /> Back to App
        </Link>
        <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
          Aura Stream Mobile
        </span>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 z-10">
        
        {/* Left Column: Hero & Action Card */}
        <div className="md:col-span-7 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-3xl p-8 text-center md:text-left relative overflow-hidden"
          >
            {/* Ambient inner glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl" />
            
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20 mb-6 mx-auto md:mx-0">
              <Smartphone className="w-8 h-8 text-white" />
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-white via-purple-100 to-purple-400 bg-clip-text text-transparent leading-tight">
              Get Aura Stream on Android
            </h1>
            
            <p className="text-zinc-400 text-sm md:text-base mt-3 leading-relaxed">
              Experience background playback, full-screen interactive music control, swipe gestures, and dynamic recommendations natively on your phone.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 mt-8">
              <a 
                href="/aura-stream.apk"
                download
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white rounded-2xl px-8 py-4 text-base font-bold flex items-center justify-center gap-3 shadow-xl shadow-purple-500/20 transition-all active:scale-98 cursor-pointer group"
              >
                <Download className="w-5 h-5 transition-transform group-hover:translate-y-0.5" />
                Download Android APK
              </a>
              
              <button 
                onClick={handleCopyLink}
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all text-sm font-semibold border border-white/5 cursor-pointer active:scale-98"
              >
                {copied ? "✓ Link Copied" : "Share Link"}
              </button>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-2 text-xs text-zinc-500 mt-6 border-t border-white/5 pt-4">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Version 1.0 (Safe & verified build)</span>
            </div>
          </motion.div>

          {/* Quick installation steps */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-zinc-300 px-2 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-purple-400" /> Easy Installation Guide
            </h3>
            
            <div className="grid grid-cols-1 gap-3">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={idx}
                    className="glass-card rounded-2xl p-5 flex gap-4 items-start"
                  >
                    <div className={`p-3 rounded-xl bg-gradient-to-tr ${step.color} text-white flex-shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-zinc-200">{step.title}</h4>
                      <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed">{step.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: QR Code & Visual Promo */}
        <div className="md:col-span-5 flex flex-col gap-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-3xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden"
          >
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl" />
            
            <h3 className="font-bold text-base text-zinc-300 mb-2">Scan to Install</h3>
            <p className="text-zinc-500 text-xs mb-6 max-w-xs">
              Scan this QR code with your phone camera to open the download page directly on your mobile device.
            </p>

            <div className="bg-white p-4 rounded-2xl shadow-2xl relative w-48 h-48 flex items-center justify-center">
              {qrUrl ? (
                <img 
                  src={qrUrl} 
                  alt="QR Code to mobile app" 
                  className="w-full h-full"
                  onError={() => console.log('QR Code failed to load')}
                />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                  <span className="text-[10px] text-zinc-500">Generating code...</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center gap-2 text-zinc-400 text-xs">
              <QrCode className="w-4 h-4 text-pink-500" />
              <span>Requires Android 8.0 or newer</span>
            </div>
          </motion.div>

          <div className="glass-card rounded-3xl p-6 flex items-center gap-4 border border-purple-500/10 bg-purple-950/5">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 text-xl font-bold flex-shrink-0">
              ⚡
            </div>
            <div>
              <h4 className="font-bold text-sm text-zinc-200">No Play Store account needed</h4>
              <p className="text-zinc-400 text-xs mt-1">Our app installs directly as a standalone native file, bypassing store restrictions.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
