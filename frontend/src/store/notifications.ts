import { create } from "zustand";
import { io, type Socket } from "socket.io-client";
import { api } from "../lib/api";

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  entityType?: string | null;
  entityId?: string | null;
  createdAt: string;
}

interface NotificationState {
  items: AppNotification[];
  socket: Socket | null;
  unread: () => number;
  fetch: () => Promise<void>;
  connect: (token: string) => void;
  disconnect: () => void;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: string) => Promise<void>;
  clear: () => Promise<void>;
}

export const useNotifications = create<NotificationState>((set, get) => ({
  items: [],
  socket: null,

  unread: () => get().items.filter((n) => !n.read).length,

  fetch: async () => {
    const { data } = await api.get("/notifications");
    set({ items: data });
  },

  connect: (token) => {
    if (get().socket) return; // já conectado
    // O Vite faz proxy de /socket.io para o backend (ws: true)
    const socket = io({ auth: { token }, transports: ["websocket", "polling"] });
    socket.on("notification:new", (n: AppNotification) => {
      set((state) => ({ items: [n, ...state.items.filter((i) => i.id !== n.id)] }));
    });
    set({ socket });
  },

  disconnect: () => {
    get().socket?.disconnect();
    set({ socket: null, items: [] });
  },

  markRead: async (id) => {
    set((state) => ({
      items: state.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
    await api.patch(`/notifications/${id}/read`);
  },

  markAllRead: async () => {
    set((state) => ({ items: state.items.map((n) => ({ ...n, read: true })) }));
    await api.patch("/notifications/read-all");
  },

  remove: async (id) => {
    set((state) => ({ items: state.items.filter((n) => n.id !== id) }));
    await api.delete(`/notifications/${id}`);
  },

  clear: async () => {
    set({ items: [] });
    await api.delete("/notifications");
  },
}));
