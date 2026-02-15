'use client';

import { useEffect } from 'react';
import { useCalendarStore } from '@/store/calendar-store';
import { CalendarMonth } from '@/components/calendar/calendar-month';
import { CalendarWeek } from '@/components/calendar/calendar-week';
import { CalendarList } from '@/components/calendar/calendar-list';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const VIEW_OPTIONS = [
  { value: 'month', label: '월간' },
  { value: 'week', label: '주간' },
  { value: 'list', label: '리스트' },
] as const;

export default function CalendarPage() {
  const {
    view,
    year,
    month,
    week,
    summary,
    isLoading,
    setView,
    navigateMonth,
    navigateWeek,
    fetchCalendarData,
  } = useCalendarStore();

  useEffect(() => {
    fetchCalendarData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- fetch on mount only

  const handlePrev = () => {
    if (view === 'week') {
      navigateWeek('prev');
    } else {
      navigateMonth('prev');
    }
  };

  const handleNext = () => {
    if (view === 'week') {
      navigateWeek('next');
    } else {
      navigateMonth('next');
    }
  };

  const navigationLabel =
    view === 'week' ? `${year}년 제${week}주` : `${year}년 ${month}월`;

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            비자 만료 캘린더
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            학생별 비자 만료일을 캘린더로 확인합니다.
          </p>
        </div>
        <div className="flex items-center gap-1">
          {VIEW_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant="outline"
              size="sm"
              className={cn(
                view === option.value &&
                  'bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white border-indigo-600'
              )}
              onClick={() => setView(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Navigation row (not shown for list view) */}
      {view !== 'list' && (
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" size="icon" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">이전</span>
          </Button>
          <span className="text-lg font-semibold text-gray-900 min-w-[160px] text-center">
            {navigationLabel}
          </span>
          <Button variant="outline" size="icon" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">다음</span>
          </Button>
        </div>
      )}

      {/* Summary row */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : (
        summary && (
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="pt-4">
                <p className="text-sm text-gray-500">30일 이내</p>
                <p className="text-2xl font-bold text-red-600">
                  {summary.within30Days}
                  <span className="text-sm font-normal text-gray-400 ml-1">
                    명
                  </span>
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="pt-4">
                <p className="text-sm text-gray-500">60일 이내</p>
                <p className="text-2xl font-bold text-amber-600">
                  {summary.within60Days}
                  <span className="text-sm font-normal text-gray-400 ml-1">
                    명
                  </span>
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-emerald-500">
              <CardContent className="pt-4">
                <p className="text-sm text-gray-500">90일 이내</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {summary.within90Days}
                  <span className="text-sm font-normal text-gray-400 ml-1">
                    명
                  </span>
                </p>
              </CardContent>
            </Card>
          </div>
        )
      )}

      {/* Content area */}
      {isLoading ? (
        <Skeleton className="h-96 rounded-lg" />
      ) : (
        <>
          {view === 'month' && <CalendarMonth />}
          {view === 'week' && <CalendarWeek />}
          {view === 'list' && <CalendarList />}
        </>
      )}
    </div>
  );
}
