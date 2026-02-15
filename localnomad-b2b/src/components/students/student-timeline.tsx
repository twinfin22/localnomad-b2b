'use client';

import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { TimelineItem } from '@/types';

interface StudentTimelineProps {
  timeline: TimelineItem[];
}

// Timeline type → dot color mapping
const DOT_COLORS: Record<TimelineItem['type'], string> = {
  STATUS_CHANGE: 'bg-blue-500',
  FIMS_REPORT: 'bg-indigo-500',
  ALERT: 'bg-amber-500',
};

// Timeline type → Korean label
const TYPE_LABELS: Record<TimelineItem['type'], string> = {
  STATUS_CHANGE: '학적변동',
  FIMS_REPORT: 'FIMS',
  ALERT: '알림',
};

const TimelineList = ({ items }: { items: TimelineItem[] }) => {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        기록이 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span
              className={`mt-1 h-2.5 w-2.5 rounded-full shrink-0 ${DOT_COLORS[item.type]}`}
            />
            <span className="w-px flex-1 bg-border" />
          </div>
          <div className="pb-4 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-foreground">
                {item.title}
              </span>
              <span className="text-xs text-muted-foreground">
                {TYPE_LABELS[item.type]}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 break-words">
              {item.description}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {formatDistanceToNow(new Date(item.date), {
                addSuffix: true,
                locale: ko,
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export function StudentTimeline({ timeline }: StudentTimelineProps) {
  const statusChanges = timeline.filter((t) => t.type === 'STATUS_CHANGE');
  const fimsReports = timeline.filter((t) => t.type === 'FIMS_REPORT');
  const alerts = timeline.filter((t) => t.type === 'ALERT');

  return (
    <Tabs defaultValue="all">
      <TabsList className="w-full">
        <TabsTrigger value="all">전체</TabsTrigger>
        <TabsTrigger value="status">학적변동</TabsTrigger>
        <TabsTrigger value="fims">FIMS</TabsTrigger>
        <TabsTrigger value="alert">알림</TabsTrigger>
      </TabsList>
      <TabsContent value="all" className="mt-4">
        <TimelineList items={timeline} />
      </TabsContent>
      <TabsContent value="status" className="mt-4">
        <TimelineList items={statusChanges} />
      </TabsContent>
      <TabsContent value="fims" className="mt-4">
        <TimelineList items={fimsReports} />
      </TabsContent>
      <TabsContent value="alert" className="mt-4">
        <TimelineList items={alerts} />
      </TabsContent>
    </Tabs>
  );
}
