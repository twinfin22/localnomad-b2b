'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCalendarStore } from '@/store/calendar-store';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  format,
} from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { VISA_TYPE_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { CalendarEvent, FimsDeadline } from '@/types';

const DAY_HEADERS = ['일', '월', '화', '수', '목', '금', '토'];

const URGENCY_COLORS: Record<string, string> = {
  RED: 'bg-red-500',
  YELLOW: 'bg-amber-400',
  GREEN: 'bg-emerald-500',
};

export function CalendarMonth() {
  const router = useRouter();
  const { year, month, events, fimsDeadlines } = useCalendarStore();

  // Build a map of date string -> CalendarEvent for fast lookups
  const eventMap = useMemo(() => {
    const map = new Map<string, CalendarEvent>();
    for (const event of events) {
      map.set(event.date, event);
    }
    return map;
  }, [events]);

  // Build a map of date string -> FimsDeadline for fast lookups
  const fimsMap = useMemo(() => {
    const map = new Map<string, FimsDeadline>();
    for (const deadline of fimsDeadlines) {
      map.set(deadline.date, deadline);
    }
    return map;
  }, [fimsDeadlines]);

  // Generate all dates for the calendar grid
  const calendarDays = useMemo(() => {
    const monthDate = new Date(year, month - 1, 1);
    const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [year, month]);

  const monthDate = new Date(year, month - 1, 1);

  return (
    <TooltipProvider>
      <div className="border rounded-lg overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-gray-50 border-b">
          {DAY_HEADERS.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-sm font-medium text-gray-600"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((date) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const event = eventMap.get(dateStr);
            const fims = fimsMap.get(dateStr);
            const sameMonth = isSameMonth(date, monthDate);
            const today = isToday(date);

            return (
              <div
                key={dateStr}
                className={cn(
                  'min-h-[100px] border-b border-r p-2 relative',
                  !sameMonth && 'bg-gray-50',
                  today && 'bg-brand-50'
                )}
              >
                {/* Date number */}
                <span
                  className={cn(
                    'text-sm',
                    !sameMonth && 'text-gray-300',
                    today && 'font-bold text-brand-600',
                    !today && sameMonth && 'text-gray-700'
                  )}
                >
                  {format(date, 'd')}
                </span>

                {/* FIMS deadline indicator */}
                {fims && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-brand-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>정기보고 마감</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Event badge */}
                {event && event.count > 0 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className={cn(
                          'mt-1 flex items-center justify-center w-full rounded-md py-1 text-xs font-medium text-white cursor-pointer hover:opacity-80 transition-opacity',
                          URGENCY_COLORS[event.urgency] ?? 'bg-gray-400'
                        )}
                      >
                        {event.count}명 만료
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="start">
                      <div className="p-3 border-b bg-gray-50">
                        <p className="text-sm font-semibold text-gray-900">
                          {month}월 {format(date, 'd')}일 만료 예정
                        </p>
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {event.students.map((student) => (
                          <button
                            key={student.id}
                            onClick={() =>
                              router.push(`/students/${student.id}`)
                            }
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-b-0 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {student.nameKr || student.nameEn}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {student.department} ·{' '}
                                  {VISA_TYPE_LABELS[student.visaType] ??
                                    student.visaType}
                                </p>
                              </div>
                              <span
                                className={cn(
                                  'text-xs font-semibold',
                                  student.daysRemaining <= 30
                                    ? 'text-red-600'
                                    : student.daysRemaining <= 60
                                      ? 'text-amber-600'
                                      : 'text-emerald-600'
                                )}
                              >
                                D-{student.daysRemaining}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
