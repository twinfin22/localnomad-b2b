'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body className="font-sans antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
          <div className="w-full max-w-md text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              오류가 발생했습니다
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              페이지를 불러오는 중 문제가 발생했습니다.
              <br />
              다시 시도해 주세요.
            </p>
            {error.digest && (
              <p className="mt-2 text-xs text-gray-400">
                오류 코드: {error.digest}
              </p>
            )}
            <button
              type="button"
              onClick={reset}
              className="mt-6 inline-flex items-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              다시 시도
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
