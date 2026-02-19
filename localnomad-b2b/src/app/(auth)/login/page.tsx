'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Shield, Globe, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo, LogoIcon } from '@/components/brand/logo';

// 로그인 페이지 — 대학 국제교류처 전용 (split layout)
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: Shield,
      title: 'IEQAS 인증 기준 모니터링',
      desc: '실시간 불법체류율 추적',
    },
    {
      icon: Globe,
      title: '다국어 AI 상담',
      desc: '6개 언어 자동 응답 지원',
    },
    {
      icon: Clock,
      title: '비자 만료 자동 알림',
      desc: '30/60/90일 전 알림 발송',
    },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-[55%] flex-col justify-between bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 p-12 text-white relative overflow-hidden">
        {/* Grid pattern overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.2) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Top — logo and tagline */}
        <div className="relative z-10 animate-fade-up">
          <LogoIcon size={48} />
          <h1 className="mt-8 text-4xl font-bold tracking-tight">
            로컬노마드
          </h1>
          <p className="mt-3 max-w-md text-lg leading-relaxed text-white/70">
            대학 국제교류처를 위한
            <br />
            유학생 비자 관리 플랫폼
          </p>
        </div>

        {/* Bottom — feature highlights */}
        <div
          className="relative z-10 space-y-5 animate-fade-up"
          style={{ animationDelay: '150ms' }}
        >
          {features.map((feat) => (
            <div key={feat.title} className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
                <feat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">{feat.title}</p>
                <p className="text-sm text-white/50">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center bg-white px-8">
        <div className="w-full max-w-sm animate-fade-in">
          {/* Mobile-only logo */}
          <div className="mb-10 lg:hidden">
            <Logo size={32} />
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            로그인
          </h2>
          <p className="mt-1.5 text-sm text-gray-500">
            학교 관리자 계정으로 로그인하세요
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">학교 이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@university.ac.kr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>

            {error && (
              <p className="text-sm text-danger-600 text-center">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-brand-600 hover:bg-brand-700 text-base font-medium"
              disabled={isLoading}
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-gray-400">
            대학 국제교류처 전용 시스템입니다
          </p>
        </div>
      </div>
    </div>
  );
}
