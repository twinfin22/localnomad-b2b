import { Users, AlertTriangle, TrendingUp, Bell } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// 목업 요약 데이터
const summaryData = [
  {
    title: '전체 학생',
    value: '1,247',
    description: '등록된 유학생 수',
    icon: Users,
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-50',
  },
  {
    title: '비자 만료 임박',
    value: '23',
    description: '60일 이내 만료 예정',
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50',
  },
  {
    title: '불법체류율',
    value: '1.8%',
    description: 'IEQAS 기본 인증 기준 충족',
    icon: TrendingUp,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
  },
  {
    title: '미확인 알림',
    value: '5',
    description: '확인이 필요한 알림',
    icon: Bell,
    iconColor: 'text-red-600',
    iconBg: 'bg-red-50',
  },
];

// 대시보드 요약 카드 4개
export function SummaryCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {summaryData.map((item) => (
        <Card key={item.title}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`rounded-lg p-3 ${item.iconBg}`}>
                <item.icon className={`h-6 w-6 ${item.iconColor}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{item.title}</p>
                <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
