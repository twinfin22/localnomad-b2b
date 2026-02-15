import { create } from 'zustand';
import { getISOWeek } from 'date-fns';
import type { CalendarEvent, FimsDeadline, CalendarSummary } from '@/types';

interface CalendarStore {
  view: 'month' | 'week' | 'list';
  year: number;
  month: number; // 1-12
  week: number;
  listFilter: '30' | '60' | '90' | 'all';
  events: CalendarEvent[];
  fimsDeadlines: FimsDeadline[];
  summary: CalendarSummary | null;
  isLoading: boolean;

  setView: (view: 'month' | 'week' | 'list') => void;
  navigateMonth: (direction: 'prev' | 'next') => void;
  navigateWeek: (direction: 'prev' | 'next') => void;
  setListFilter: (filter: '30' | '60' | '90' | 'all') => void;
  fetchCalendarData: () => Promise<void>;
}

const now = new Date();

export const useCalendarStore = create<CalendarStore>((set, get) => ({
  view: 'month',
  year: now.getFullYear(),
  month: now.getMonth() + 1, // 1-12
  week: getISOWeek(now),
  listFilter: '30',
  events: [],
  fimsDeadlines: [],
  summary: null,
  isLoading: false,

  setView: (view) => {
    set({ view });
    get().fetchCalendarData();
  },

  navigateMonth: (direction) => {
    const { month, year } = get();
    if (direction === 'prev') {
      if (month === 1) {
        set({ month: 12, year: year - 1 });
      } else {
        set({ month: month - 1 });
      }
    } else {
      if (month === 12) {
        set({ month: 1, year: year + 1 });
      } else {
        set({ month: month + 1 });
      }
    }
    get().fetchCalendarData();
  },

  navigateWeek: (direction) => {
    const { week, year } = get();
    if (direction === 'prev') {
      if (week === 1) {
        set({ week: 52, year: year - 1 });
      } else {
        set({ week: week - 1 });
      }
    } else {
      if (week === 52) {
        set({ week: 1, year: year + 1 });
      } else {
        set({ week: week + 1 });
      }
    }
    get().fetchCalendarData();
  },

  setListFilter: (filter) => {
    set({ listFilter: filter });
    get().fetchCalendarData();
  },

  fetchCalendarData: async () => {
    const { year, month, view, week, listFilter } = get();
    set({ isLoading: true });

    try {
      const params = new URLSearchParams();
      params.set('year', String(year));
      params.set('month', String(month));
      params.set('view', view);
      params.set('week', String(week));
      params.set('filter', listFilter);

      const response = await fetch(`/api/calendar?${params.toString()}`);
      const json = await response.json();

      if (!response.ok || !json.success) {
        set({ isLoading: false });
        return;
      }

      set({
        events: json.data?.events ?? [],
        fimsDeadlines: json.data?.fimsDeadlines ?? [],
        summary: json.data?.summary ?? null,
        isLoading: false,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('캘린더 데이터 로딩 실패:', error.message);
      }
      set({ isLoading: false });
    }
  },
}));
