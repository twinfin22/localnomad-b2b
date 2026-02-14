import { AlertTriangle, Clock, FileWarning, Shield, Heart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// 목업 최근 알림 데이터
const recentAlerts = [
  {
    id: '1',
    type: 'VISA_EXPIRY' as const,
    title: '비자 만료 임박',
    message: 'NGUYEN Van A 학생의 비자가 15일 후 만료됩니다.',
    time: '2시간 전',
    icon: Clock,
    badgeColor: 'bg-red-100 text-red-700',
  },
  {
    id: '2',
    type: 'FIMS_DEADLINE' as const,
    title: 'FIMS 변동신고 기한',
    message: '김철수 학생의 휴학 변동신고 기한이 3일 남았습니다.',
    time: '4시간 전',
    icon: FileWarning,
    badgeColor: 'bg-amber-100 text-amber-700',
  },
  {
    id: '3',
    type: 'ATTENDANCE_LOW' as const,
    title: '출석률 저조',
    message: 'WANG Wei 학생의 출석률이 65%로 기준 미달입니다.',
    time: '6시간 전',
    icon: AlertTriangle,
    badgeColor: 'bg-orange-100 text-orange-700',
  },
  {
    id: '4',
    type: 'IEQAS_WARNING' as const,
    title: 'IEQAS 불법체류율 경고',
    message: '현재 불법체류율 1.8% — 우수 인증 기준(1%) 초과',
    time: '1일 전',
    icon: Shield,
    badgeColor: 'bg-purple-100 text-purple-700',
  },
  {
    id: '5',
    type: 'INSURANCE_EXPIRY' as const,
    title: '보험 만료 예정',
    message: 'TRAN Thi B 학생의 건강보험이 7일 후 만료됩니다.',
    time: '1일 전',
    icon: Heart,
    badgeColor: 'bg-pink-100 text-pink-700',
  },
];

// 최근 알림 리스트 (5건)
export function RecentAlerts() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>최근 알림</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentAlerts.map((alert) => (
          <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="mt-0.5">
              <alert.icon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className={alert.badgeColor}>
                  {alert.title}
                </Badge>
                <span className="text-xs text-gray-400">{alert.time}</span>
              </div>
              <p className="text-sm text-gray-600 truncate">{alert.message}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
