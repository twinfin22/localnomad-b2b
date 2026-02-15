'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStudentStore } from '@/store/student-store';
import {
  TRAFFIC_LIGHT_LABELS,
  VISA_STATUS_LABELS,
  ENROLLMENT_STATUS_LABELS,
  VISA_TYPE_LABELS,
} from '@/lib/constants';

export function StudentFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters = useStudentStore((s) => s.filters);
  const setFilter = useStudentStore((s) => s.setFilter);
  const resetFilters = useStudentStore((s) => s.resetFilters);

  // Local search ref for debounce — avoids setState-in-effect lint error
  const searchInputRef = useRef<HTMLInputElement>(null);
  const initializedRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync URL params to store on mount (one-time)
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const urlSearch = searchParams.get('search') ?? '';
    const urlTrafficLight = searchParams.get('trafficLight') ?? '';
    const urlVisaStatus = searchParams.get('visaStatus') ?? '';
    const urlEnrollmentStatus = searchParams.get('enrollmentStatus') ?? '';
    const urlVisaType = searchParams.get('visaType') ?? '';
    const urlDepartment = searchParams.get('department') ?? '';
    const urlSortBy = searchParams.get('sortBy') ?? '';
    const urlSortOrder = searchParams.get('sortOrder') ?? '';

    if (urlSearch) {
      setFilter('search', urlSearch);
      // Sync DOM input value directly via ref (no setState needed)
      if (searchInputRef.current) {
        searchInputRef.current.value = urlSearch;
      }
    }
    if (urlTrafficLight) setFilter('trafficLight', urlTrafficLight);
    if (urlVisaStatus) setFilter('visaStatus', urlVisaStatus);
    if (urlEnrollmentStatus) setFilter('enrollmentStatus', urlEnrollmentStatus);
    if (urlVisaType) setFilter('visaType', urlVisaType);
    if (urlDepartment) setFilter('department', urlDepartment);
    if (urlSortBy) setFilter('sortBy', urlSortBy);
    if (urlSortOrder) setFilter('sortOrder', urlSortOrder);
  }, [searchParams, setFilter]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Sync filter changes to URL
  const syncUrl = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const handleFilterChange = (key: 'trafficLight' | 'visaStatus' | 'enrollmentStatus' | 'visaType', value: string) => {
    // Radix Select uses "__ALL__" sentinel value for "전체"
    const resolvedValue = value === '__ALL__' ? '' : value;
    setFilter(key, resolvedValue);
    syncUrl(key, resolvedValue);
  };

  const handleSearchChange = (value: string) => {
    // Debounce: clear previous timer, set new 300ms timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Update URL immediately for shareable links
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    router.replace(`?${params.toString()}`, { scroll: false });

    // Debounce the store update (triggers API call)
    debounceTimerRef.current = setTimeout(() => {
      setFilter('search', value);
    }, 300);
  };

  const handleReset = () => {
    // Clear the uncontrolled input directly via ref
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }
    resetFilters();
    router.replace('?', { scroll: false });
  };

  const hasActiveFilters =
    filters.search ||
    filters.trafficLight ||
    filters.visaStatus ||
    filters.enrollmentStatus ||
    filters.visaType;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search input (uncontrolled — avoids setState-in-effect for URL sync) */}
      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={searchInputRef}
          placeholder="이름으로 검색..."
          defaultValue={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Traffic Light filter */}
      <Select
        value={filters.trafficLight || '__ALL__'}
        onValueChange={(v) => handleFilterChange('trafficLight', v)}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="상태" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__ALL__">전체</SelectItem>
          {Object.entries(TRAFFIC_LIGHT_LABELS).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Visa Status filter */}
      <Select
        value={filters.visaStatus || '__ALL__'}
        onValueChange={(v) => handleFilterChange('visaStatus', v)}
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="비자 상태" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__ALL__">전체</SelectItem>
          {Object.entries(VISA_STATUS_LABELS).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Enrollment Status filter */}
      <Select
        value={filters.enrollmentStatus || '__ALL__'}
        onValueChange={(v) => handleFilterChange('enrollmentStatus', v)}
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="학적 상태" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__ALL__">전체</SelectItem>
          {Object.entries(ENROLLMENT_STATUS_LABELS).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Visa Type filter */}
      <Select
        value={filters.visaType || '__ALL__'}
        onValueChange={(v) => handleFilterChange('visaType', v)}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="비자 유형" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__ALL__">전체</SelectItem>
          {Object.entries(VISA_TYPE_LABELS).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Reset button */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={handleReset} className="text-gray-500">
          <X className="h-4 w-4 mr-1" />
          필터 초기화
        </Button>
      )}
    </div>
  );
}
