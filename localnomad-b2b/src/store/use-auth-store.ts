import { create } from 'zustand';

interface AuthState {
  // 사이드바 접힘 상태
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // 알림 카운트
  unreadAlertCount: number;
  setUnreadAlertCount: (count: number) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // 사이드바 기본값: 펼침
  isSidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),

  // 미확인 알림
  unreadAlertCount: 0,
  setUnreadAlertCount: (count) => set({ unreadAlertCount: count }),
}));
