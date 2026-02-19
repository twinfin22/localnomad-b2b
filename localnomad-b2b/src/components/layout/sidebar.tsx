'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardList,
  Download,
  Bell,
  Settings,
  LogOut,
} from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

// 사이드바 네비게이션 항목
const navItems = [
  { href: '/', label: '대시보드', icon: LayoutDashboard },
  { href: '/students', label: '학생 관리', icon: Users },
  { href: '/calendar', label: '비자 캘린더', icon: Calendar },
  { href: '/fims', label: 'FIMS 관리', icon: ClipboardList },
  { href: '/import', label: '데이터 임포트', icon: Download },
  { href: '/alerts', label: '알림', icon: Bell },
  { href: '/settings', label: '설정', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col border-r bg-white">
      {/* 로고 영역 */}
      <div className="flex h-16 items-center px-6">
        <Logo size={28} />
      </div>

      <Separator />

      {/* 네비게이션 메뉴 */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive ? 'text-brand-600' : 'text-gray-400')} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* 하단: 대학명 + 로그아웃 */}
      <div className="p-4">
        <p className="mb-2 text-xs text-gray-500 truncate">호서대학교 국제교류처</p>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-gray-500 hover:text-red-600"
          onClick={() => {
            // TODO: signOut() 연동
          }}
        >
          <LogOut className="h-4 w-4" />
          로그아웃
        </Button>
      </div>
    </div>
  );
}
