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
    clearAllNotifications: () => void; 
    removeNotification: (id: number) => void; 
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
      set({ notifications: [] }),
    removeNotification: (id) =>
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id)
      }))
  }));