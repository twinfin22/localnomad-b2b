import { cn } from '@/lib/utils';
import type { TrafficLightStatus } from '@/types';

// 트래픽 라이트 상태별 색상 매핑
const statusConfig: Record<TrafficLightStatus, { color: string; label: string }> = {
  GREEN: { color: 'bg-emerald-500', label: '정상' },
  YELLOW: { color: 'bg-amber-400', label: '주의' },
  ORANGE: { color: 'bg-orange-500', label: '경고' },
  RED: { color: 'bg-red-500', label: '위험' },
};

interface TrafficLightProps {
  status: TrafficLightStatus;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// 학생 상태 도트 컴포넌트 (GREEN/YELLOW/ORANGE/RED)
export function TrafficLight({ status, showLabel = false, size = 'md' }: TrafficLightProps) {
  const config = statusConfig[status];
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  return (
    <div className="flex items-center gap-2">
      <span className={cn('rounded-full inline-block', sizeClasses[size], config.color)} />
      {showLabel && (
        <span className="text-sm text-gray-600">{config.label}</span>
      )}
    </div>
  );
}
