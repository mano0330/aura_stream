import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import YouTubePlayer from "@/components/YouTubePlayer";
import AuthGuard from "@/components/AuthGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Aura Stream — AI-Powered Music Streaming",
    template: "%s | Aura Stream",
  },
  description:
    "Discover, stream, and share music with Aura Stream — the AI-powered platform with glassmorphic design, smart playlists, and an AI DJ. Free, legal, YouTube-powered.",
  keywords: ["music streaming", "AI playlist", "YouTube music", "aura stream", "music discovery"],
  authors: [{ name: "Aura Stream" }],
  creator: "Aura Stream",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Aura Stream",
  },
  openGraph: {
    type: "website",
    siteName: "Aura Stream",
    title: "Aura Stream — AI-Powered Music Streaming",
    description: "The most beautiful AI music platform built by a solo founder.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aura Stream",
    description: "AI-powered music streaming with glassmorphic design.",
  },
};

export const viewport: Viewport = {
  themeColor: "#9333ea",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>
          <AuthGuard>
            {children}
          </AuthGuard>
          <YouTubePlayer />
        </Providers>
      </body>
    </html>
  );
}
