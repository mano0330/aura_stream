'use client';

import { ReactNode, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUiStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: false,
          },
        },
      }),
  );

  const initializeTheme = useUiStore((state) => state.initializeTheme);
  const initializeAuth = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initializeTheme();
    initializeAuth();

    // Register PWA Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[Aura PWA] Service worker registered:', reg.scope);
        })
        .catch((err) => {
          console.warn('[Aura PWA] Service worker registration failed:', err);
        });
    }
  }, [initializeTheme, initializeAuth]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
