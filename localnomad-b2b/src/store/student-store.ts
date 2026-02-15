import { create } from 'zustand';
import type { StudentWithTrafficLight } from '@/types';

interface StudentFilters {
  search: string;
  trafficLight: string; // '' | 'GREEN' | 'YELLOW' | 'RED'
  visaStatus: string;
  enrollmentStatus: string;
  visaType: string;
  department: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface StudentStore {
  students: StudentWithTrafficLight[];
  total: number;
  isLoading: boolean;
  error: string | null;
  page: number;
  limit: number;
  filters: StudentFilters;
  fetchStudents: () => Promise<void>;
  setPage: (page: number) => void;
  setFilter: (key: keyof StudentFilters, value: string) => void;
  resetFilters: () => void;
}

const DEFAULT_FILTERS: StudentFilters = {
  search: '',
  trafficLight: '',
  visaStatus: '',
  enrollmentStatus: '',
  visaType: '',
  department: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export const useStudentStore = create<StudentStore>((set, get) => ({
  students: [],
  total: 0,
  isLoading: false,
  error: null,
  page: 1,
  limit: 20,
  filters: { ...DEFAULT_FILTERS },

  fetchStudents: async () => {
    const { page, limit, filters } = get();
    set({ isLoading: true, error: null });

    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));

      if (filters.search) params.set('search', filters.search);
      if (filters.trafficLight) params.set('trafficLight', filters.trafficLight);
      if (filters.visaStatus) params.set('visaStatus', filters.visaStatus);
      if (filters.enrollmentStatus) params.set('enrollmentStatus', filters.enrollmentStatus);
      if (filters.visaType) params.set('visaType', filters.visaType);
      if (filters.department) params.set('department', filters.department);
      if (filters.sortBy) params.set('sortBy', filters.sortBy);
      if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);

      const response = await fetch(`/api/students?${params.toString()}`);
      const json = await response.json();

      if (!response.ok || !json.success) {
        set({
          error: json.error ?? '학생 목록을 불러오는데 실패했습니다.',
          isLoading: false,
        });
        return;
      }

      set({
        students: json.data ?? [],
        total: json.meta?.total ?? 0,
        isLoading: false,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : '학생 목록을 불러오는데 실패했습니다.';
      set({ error: message, isLoading: false });
    }
  },

  setPage: (page: number) => {
    set({ page });
    get().fetchStudents();
  },

  setFilter: (key: keyof StudentFilters, value: string) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value },
      page: 1,
    }));
    get().fetchStudents();
  },

  resetFilters: () => {
    set({ filters: { ...DEFAULT_FILTERS }, page: 1 });
    get().fetchStudents();
  },
}));
