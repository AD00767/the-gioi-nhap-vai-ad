import { create } from 'zustand';
import { User } from 'firebase/auth';

interface AuthState {
  firebaseUser: User | null;
  user: any | null; // Backend user data
  isInitialized: boolean;
  setAuth: (firebaseUser: User | null, backendUser: any | null) => void;
  setInitialized: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUser: null,
  user: null,
  isInitialized: false,
  setAuth: (firebaseUser, backendUser) => {
    if (backendUser) {
      if (backendUser.role) {
        localStorage.setItem('cached_user_role', backendUser.role);
      }
      if (backendUser.creatorStatus !== undefined) {
        localStorage.setItem('cached_creator_status', String(backendUser.creatorStatus));
      }
    }
    set({ firebaseUser, user: backendUser });
  },
  setInitialized: (val) => set({ isInitialized: val }),
}));

