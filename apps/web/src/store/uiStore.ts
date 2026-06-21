import { create } from 'zustand';

interface UiState {
  theme: 'dark' | 'light';
  isSidebarOpen: boolean;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  initializeTheme: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  theme: 'dark',
  isSidebarOpen: true,

  toggleTheme: () => set((state) => {
    const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
    if (typeof window !== 'undefined') {
      localStorage.setItem('aura_theme', nextTheme);
      if (nextTheme === 'light') {
        document.documentElement.classList.add('light-mode');
      } else {
        document.documentElement.classList.remove('light-mode');
      }
    }
    return { theme: nextTheme };
  }),

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('aura_theme', theme);
      if (theme === 'light') {
        document.documentElement.classList.add('light-mode');
      } else {
        document.documentElement.classList.remove('light-mode');
      }
    }
    set({ theme });
  },

  initializeTheme: () => {
    if (typeof window === 'undefined') return;
    const cachedTheme = localStorage.getItem('aura_theme') as 'dark' | 'light';
    const theme = cachedTheme || 'dark'; // Default to premium dark theme
    
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
    
    set({ theme });
  }
}));
