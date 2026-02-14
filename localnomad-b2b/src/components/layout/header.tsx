'use client';

import { usePathname } from 'next/navigation';
import { Bell, Menu, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// 페이지 경로별 제목 매핑
const pageTitles: Record<string, string> = {
  '/': '대시보드',
  '/students': '학생 관리',
  '/calendar': '비자 캘린더',
  '/fims': 'FIMS 관리',
  '/import': '데이터 임포트',
  '/alerts': '알림',
  '/settings': '설정',
};

interface HeaderProps {
  onMobileMenuClick: () => void;
}

export function Header({ onMobileMenuClick }: HeaderProps) {
  const pathname = usePathname();

  // 현재 페이지 제목 결정
  const getPageTitle = () => {
    if (pageTitles[pathname]) return pageTitles[pathname];
    if (pathname.startsWith('/students/')) return '학생 상세';
    return '대시보드';
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-white px-6">
      {/* 좌측: 모바일 메뉴 + 브레드크럼 */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMobileMenuClick}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">메뉴 열기</span>
        </Button>

        {/* 브레드크럼 */}
        <nav className="flex items-center gap-1 text-sm">
          <span className="text-gray-400">로컬노마드</span>
          <ChevronRight className="h-4 w-4 text-gray-300" />
          <span className="font-medium text-gray-900">{getPageTitle()}</span>
        </nav>
      </div>

      {/* 우측: 알림 + 유저 아바타 */}
      <div className="flex items-center gap-3">
        {/* 알림 벨 아이콘 */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-gray-500" />
          <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] bg-red-500 text-white border-2 border-white">
            5
          </Badge>
          <span className="sr-only">알림</span>
        </Button>

        {/* 유저 드롭다운 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-indigo-100 text-indigo-600 text-sm font-medium">
                  관
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:block text-sm font-medium text-gray-700">
                관리자
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>프로필 설정</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
