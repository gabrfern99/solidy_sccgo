import { create } from "zustand";
import { api } from "../lib/api";
import type { Company, User } from "../lib/types";

interface AuthState {
  user: User | null;
  company: Company | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    companyName: string;
    cnpj: string;
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  loadMe: () => Promise<void>;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  company: null,
  token: localStorage.getItem("token"),
  loading: false,

  login: async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", data.token);
    set({ token: data.token, user: data.user, company: data.company });
  },

  register: async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    localStorage.setItem("token", data.token);
    set({ token: data.token, user: data.user, company: data.company });
  },

  loadMe: async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    set({ loading: true });
    try {
      const { data } = await api.get("/auth/me");
      set({ user: data.user, company: data.company, token });
    } catch {
      localStorage.removeItem("token");
      set({ user: null, company: null, token: null });
    } finally {
      set({ loading: false });
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ user: null, company: null, token: null });
  },
}));
