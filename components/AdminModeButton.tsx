"use client";

import { useState } from "react";

// TODO: 지금은 비밀번호가 코드에 하드코딩되어 있음(1234). 실제 운영 전에는
// 환경변수나 서버 인증으로 바꿔야 함 - 지금은 프론트엔드 프로토타입이라 임시 처리.
const ADMIN_PASSWORD = "1234";

export default function AdminModeButton({
  isAdmin,
  onChange,
}: {
  isAdmin: boolean;
  onChange: (next: boolean, password?: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (isAdmin) {
      // 이미 관리자 모드면 바로 끄기 - 다시 비밀번호 요구 안 함
      onChange(false);
      return;
    }
    setPassword("");
    setError(null);
    setIsOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password !== ADMIN_PASSWORD) {
      setError("비밀번호가 일치하지 않습니다");
      return;
    }

    onChange(true, password);
    setIsOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
          isAdmin
            ? "bg-gray-900 border-gray-900 text-white hover:bg-gray-800"
            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
        }`}
      >
        {isAdmin ? "관리자 모드 끄기" : "관리자 모드"}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              관리자 모드
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              관리자 비밀번호를 입력해 주십시오.
            </p>

            <form onSubmit={handleSubmit}>
              <input
                autoFocus
                type="password"
                inputMode="numeric"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="비밀번호"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
              />

              {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium"
                >
                  확인
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
