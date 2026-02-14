import { withAuth } from 'next-auth/middleware';

// 인증되지 않은 사용자를 로그인 페이지로 리다이렉트
export default withAuth({
  pages: { signIn: '/login' },
});

// 보호 라우트 매처 (로그인, API 인증, 정적 파일 제외)
export const config = {
  matcher: [
    '/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
