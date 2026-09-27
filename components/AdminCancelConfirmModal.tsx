"use client";

import { useState } from "react";
import type { LotId } from "@/lib/mockRoster";

export default function AdminCancelConfirmModal({
  date,
  lot,
  spotNumber,
  adminPassword,
  onClose,
  onCancelled,
}: {
  date: string;
  lot: LotId;
  spotNumber: number;
  adminPassword: string;
  onClose: () => void;
  onCancelled: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleConfirm() {
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/spots/admin-cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lot, spotNumber, date, adminPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "취소에 실패했습니다");
        return;
      }

      onCancelled();
    } catch {
      setError("서버와 통신 중 오류가 발생했습니다");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          {spotNumber}번 자리 취소
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          {date} 날짜의 등록/신청을 취소하시겠습니까? 관리자 권한으로
          비밀번호 확인 없이 바로 취소됩니다.
        </p>

        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
          >
            아니오
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50"
          >
            {isSubmitting ? "취소하는 중..." : "취소하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
