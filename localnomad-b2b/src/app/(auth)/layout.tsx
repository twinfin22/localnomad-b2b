// 인증 페이지 레이아웃 — 로그인 등이 자체 전체 화면 레이아웃을 관리
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
