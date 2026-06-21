import { create } from 'zustand';

export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  role: string;
  createdAt: string;
  preferences?: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('aura_token', token);
      localStorage.setItem('aura_user', JSON.stringify(user));
    }
    set({ user, token, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('aura_token');
      localStorage.removeItem('aura_user');
    }
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  updateUser: (updatedFields) => {
    set((state) => {
      if (!state.user) return state;
      const newUser = { ...state.user, ...updatedFields };
      if (typeof window !== 'undefined') {
        localStorage.setItem('aura_user', JSON.stringify(newUser));
      }
      return { user: newUser };
    });
  },

  initialize: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('aura_token');
    const userJson = localStorage.getItem('aura_user');
    
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);
        set({ token, user, isAuthenticated: true, isLoading: false });
      } catch (e) {
        localStorage.removeItem('aura_token');
        localStorage.removeItem('aura_user');
        set({ token: null, user: null, isAuthenticated: false, isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  }
}));
