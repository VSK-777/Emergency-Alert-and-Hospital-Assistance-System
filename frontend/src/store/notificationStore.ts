import { create } from 'zustand';
import type { NotificationItem } from '../types';

interface NotificationState {
  notifications: NotificationItem[];
  isOpen: boolean;
  addNotification: (item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  toggleDrawer: () => void;
  setDrawerOpen: (open: boolean) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  isOpen: false,

  addNotification: (item) => {
    const newItem: NotificationItem = {
      ...item,
      id: 'notif-' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      read: false,
    };
    set((state) => ({
      notifications: [newItem, ...state.notifications.slice(0, 49)], // keep last 50
    }));
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },

  clearAll: () => {
    set({ notifications: [] });
  },

  toggleDrawer: () => {
    set((state) => ({ isOpen: !state.isOpen }));
  },

  setDrawerOpen: (open) => {
    set({ isOpen: open });
  },
}));
