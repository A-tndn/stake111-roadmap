'use client';

import { create } from 'zustand';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  category?: string;
  priority?: string;
  actionUrl?: string;
  actionLabel?: string;
  persistent?: boolean; // Backed by server
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number; // ms, default 5000
  actionUrl?: string;
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  toasts: Toast[];

  // Notification management
  addNotification: (notif: Omit<Notification, 'id' | 'timestamp' | 'read'> & { id?: string }) => void;
  setNotifications: (notifications: Notification[], unreadCount: number) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  setUnreadCount: (count: number) => void;

  // Toast management
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

let notifCounter = 0;
let toastCounter = 0;

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  toasts: [],

  addNotification: (notif) =>
    set((state) => {
      const newNotif: Notification = {
        ...notif,
        id: notif.persistent ? notif.id || `notif-${++notifCounter}` : `notif-${++notifCounter}`,
        timestamp: new Date().toISOString(),
        read: false,
      };
      const updated = [newNotif, ...state.notifications].slice(0, 50);
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      };
    }),

  setNotifications: (notifications, unreadCount) =>
    set({ notifications, unreadCount }),

  markAsRead: (id) =>
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      };
    }),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  clearAll: () => set({ notifications: [], unreadCount: 0 }),

  setUnreadCount: (count) => set({ unreadCount: count }),

  addToast: (toast) =>
    set((state) => {
      const newToast: Toast = {
        ...toast,
        id: `toast-${++toastCounter}`,
      };
      return {
        toasts: [...state.toasts, newToast].slice(-5), // Max 5 toasts
      };
    }),

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  clearToasts: () => set({ toasts: [] }),
}));
