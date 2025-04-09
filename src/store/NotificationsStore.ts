// src/store/notificationsStore.ts
import { create } from 'zustand';

type Notification = {
  id: number;
  message: string;
  read: boolean;
};


interface NotificationStore {
    notifications: Notification[];
    addNotification: (message: string) => void;
    markAllAsRead: () => void;
    clearAllNotifications: () => void; // ✅ new
  }
  let idCounter = 0;

  export const useNotificationStore = create<NotificationStore>((set) => ({
    notifications: [],
    addNotification: (message) =>
      set((state) => ({
        notifications: [
          ...state.notifications,
          { id: ++idCounter, message, read: false }
        ]
      })),
    markAllAsRead: () =>
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true }))
      })),
    clearAllNotifications: () =>
      set({ notifications: [] }) // ✅ clear all
  }));
  
