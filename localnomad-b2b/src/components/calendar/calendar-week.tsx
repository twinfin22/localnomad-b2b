'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCalendarStore } from '@/store/calendar-store';
import { addDays, format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { VISA_TYPE_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

// Calculate the start of a given ISO week (Monday) then shift to Sunday start
const getWeekStartDate = (year: number, week: number): Date => {
  // Jan 4 is always in ISO week 1
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay(); // 0=Sun, 1=Mon...
  // Monday of ISO week 1
  const mondayWeek1 = addDays(jan4, 1 - (dayOfWeek === 0 ? 7 : dayOfWeek));
  // Monday of the target week
  const mondayTarget = addDays(mondayWeek1, (week - 1) * 7);
  // Shift to Sunday start (one day before Monday)
  return addDays(mondayTarget, -1);
};

export function CalendarWeek() {
  const router = useRouter();
  const { year, week, events } = useCalendarStore();

  // Generate the 7 days for this week
  const weekDays = useMemo(() => {
    const start = getWeekStartDate(year, week);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [year, week]);

  // Map events by date for fast lookup
  const eventMap = useMemo(() => {
    const map = new Map<string, typeof events[number]>();
    for (const event of events) {
      map.set(event.date, event);
    }
    return map;
  }, [events]);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="grid grid-cols-7">
        {weekDays.map((day, idx) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const event = eventMap.get(dateStr);
          const today =
            format(new Date(), 'yyyy-MM-dd') === dateStr;

          return (
            <div
              key={dateStr}
              className={cn(
                'border-r last:border-r-0 min-h-[300px]',
                today && 'bg-indigo-50'
              )}
            >
              {/* Day header */}
              <div
                className={cn(
                  'px-3 py-2 border-b text-center',
                  today ? 'bg-indigo-100' : 'bg-gray-50'
                )}
              >
                <p
                  className={cn(
                    'text-xs font-medium',
                    today ? 'text-indigo-600' : 'text-gray-500'
                  )}
                >
                  {DAY_NAMES[idx]}
                </p>
                <p
                  className={cn(
                    'text-lg font-bold',
                    today ? 'text-indigo-700' : 'text-gray-900'
                  )}
                >
                  {format(day, 'M/d')}
                </p>
              </div>

              {/* Student cards */}
              <div className="p-2 space-y-2">
                {event && event.students.length > 0 ? (
                  event.students.map((student) => (
                    <button
                      key={student.id}
                      onClick={() =>
                        router.push(`/students/${student.id}`)
                      }
                      className="w-full text-left p-2 rounded-md border bg-white hover:bg-gray-50 shadow-sm transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {student.nameKr || student.nameEn}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {student.department}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-400">
                          {VISA_TYPE_LABELS[student.visaType] ??
                            student.visaType}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          미요청
                        </Badge>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 text-center py-4">
                    만료 예정 학생 없음
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
