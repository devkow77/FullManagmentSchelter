import { create } from "zustand";
import axios from "axios";
import type { AuthUser } from "@/types";

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

// Konfiguracja Axiosa (możesz to wyciągnąć do osobnego pliku api.ts)
const api = axios.create({
  baseURL: "http://localhost:4000/api", // Twój URL backendu
  withCredentials: true, // KLUCZOWE dla HttpOnly Cookies
});

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // Zaczynamy od ładowania, dopóki nie sprawdzimy sesji

  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const response = await api.get("/auth/info", {
        withCredentials: true,
      });
      set({ user: response.data, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  logout: async () => {
    try {
      await api.get("/auth/logout");
      set({ user: null, isAuthenticated: false });
      window.location.href = "/login"; // Przekierowanie po wylogowaniu
    } catch (error) {
      console.error("Błąd wylogowania:", error);
    }
  },
}));
