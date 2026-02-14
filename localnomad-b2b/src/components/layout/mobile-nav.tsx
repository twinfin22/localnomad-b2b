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
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

// 모바일 네비게이션 메뉴 항목 (사이드바와 동일)
const navItems = [
  { href: '/', label: '대시보드', icon: LayoutDashboard },
  { href: '/students', label: '학생 관리', icon: Users },
  { href: '/calendar', label: '비자 캘린더', icon: Calendar },
  { href: '/fims', label: 'FIMS 관리', icon: ClipboardList },
  { href: '/import', label: '데이터 임포트', icon: Download },
  { href: '/alerts', label: '알림', icon: Bell },
  { href: '/settings', label: '설정', icon: Settings },
];

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// 모바일용 Sheet 기반 네비게이션
export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="flex h-16 items-center gap-2 px-6 flex-row">
          <GraduationCap className="h-6 w-6 text-indigo-600" />
          <SheetTitle className="text-lg font-bold text-indigo-600">로컬노마드</SheetTitle>
        </SheetHeader>
        <Separator />
        <nav className="space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <item.icon className={cn('h-5 w-5', isActive ? 'text-indigo-600' : 'text-gray-400')} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
