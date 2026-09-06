"use client";

import { useState } from "react";

type Props = {
  date: string;
  spotNumber: number;
  onClose: () => void;
  onCancel: (pin: string) => { success: boolean; error?: string };
};

export default function CancelModal({
  date,
  spotNumber,
  onClose,
  onCancel,
}: Props) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!/^\d{4}$/.test(pin)) {
      setError("비밀번호는 숫자 4자리로 입력해 주십시오");
      return;
    }

    const result = onCancel(pin);

    if (!result.success) {
      setError(result.error ?? "취소에 실패했습니다");
      return;
    }

    // 성공 시 부모 컴포넌트가 모달을 닫음
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          신관 {spotNumber}번 등록/신청 취소
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          {date} 날짜에 등록하거나 신청할 때 입력한 비밀번호 4자리를 입력해
          주십시오.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            autoFocus
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
              setError(null);
            }}
            placeholder="비밀번호 4자리"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
          />

          {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
            >
              닫기
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium"
            >
              취소하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
