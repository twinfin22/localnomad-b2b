import { create } from 'zustand';

interface AlertData {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  sentAt: string;
  studentId: string | null;
  student: { nameKr: string | null; nameEn: string } | null;
}

interface AlertStore {
  unreadCount: number;
  alerts: AlertData[];
  isLoading: boolean;
  isPanelOpen: boolean;
  setIsPanelOpen: (open: boolean) => void;
  fetchUnreadCount: () => Promise<void>;
  fetchRecentAlerts: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  startPolling: () => () => void;
}

export const useAlertStore = create<AlertStore>((set, get) => ({
  unreadCount: 0,
  alerts: [],
  isLoading: false,
  isPanelOpen: false,

  setIsPanelOpen: (open: boolean) => {
    set({ isPanelOpen: open });
  },

  fetchUnreadCount: async () => {
    try {
      const response = await fetch('/api/alerts/count');
      if (!response.ok) return;
      const json = await response.json();
      if (json.success) {
        set({ unreadCount: json.data.unreadCount });
      }
    } catch {
      // Silently fail for polling — avoid flooding user with errors
    }
  },

  fetchRecentAlerts: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/alerts?limit=10&isRead=false');
      if (!response.ok) {
        set({ isLoading: false });
        return;
      }
      const json = await response.json();
      if (json.success) {
        set({ alerts: json.data ?? [], isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id: string) => {
    try {
      const response = await fetch(`/api/alerts/${id}/read`, { method: 'PUT' });
      if (!response.ok) return;
      const json = await response.json();
      if (json.success) {
        set((state) => ({
          unreadCount: Math.max(0, state.unreadCount - 1),
          alerts: state.alerts.map((alert) =>
            alert.id === id ? { ...alert, isRead: true } : alert,
          ),
        }));
      }
    } catch {
      // Error handled silently — UI already shows the alert
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await fetch('/api/alerts/read-all', { method: 'PUT' });
      if (!response.ok) return;
      const json = await response.json();
      if (json.success) {
        set((state) => ({
          unreadCount: 0,
          alerts: state.alerts.map((alert) => ({ ...alert, isRead: true })),
        }));
      }
    } catch {
      // Error handled silently
    }
  },

  startPolling: () => {
    const { fetchUnreadCount } = get();
    const interval = setInterval(() => {
      void fetchUnreadCount();
    }, 30000);
    return () => clearInterval(interval);
  },
}));
