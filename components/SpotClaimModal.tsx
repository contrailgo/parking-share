"use client";

import { useState } from "react";
import type { LotId } from "@/lib/mockRoster";

type Props = {
  date: string;
  lot: LotId;
  spotNumber: number;
  waitingOnly: boolean; // true면 이미 외부배정자가 신청한 자리 - 대기자만 우선신청 가능
  onClose: () => void;
  onClaimed: () => void; // 성공 시 부모가 자리 목록을 다시 불러오도록 알림
};

export default function SpotClaimModal({
  date,
  lot,
  spotNumber,
  waitingOnly,
  onClose,
  onClaimed,
}: Props) {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/spots/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lot,
          spotNumber,
          date,
          name: name.trim(),
          pin,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "신청에 실패했습니다");
        return;
      }

      onClaimed();
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
          신관 {spotNumber}번 신청
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          {waitingOnly
            ? `이미 외부 배정자가 신청한 자리입니다. 대기자는 우선신청이 가능합니다.`
            : `${date} 날짜에 이 자리를 신청할 이름을 입력해 주십시오.`}
        </p>

        <form onSubmit={handleSubmit} autoComplete="off">
          <input
            autoFocus
            type="text"
            name="spot-claim-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder="이름"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6022A7]"
          />

          <input
            type="password"
            name="spot-claim-pin"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
              setError(null);
            }}
            placeholder="비밀번호 설정(4자리)"
            autoComplete="new-password"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6022A7]"
          />

          {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-lg bg-[#6022A7] hover:bg-[#4f1c89] text-white text-sm font-medium disabled:opacity-50"
            >
              {isSubmitting ? "신청 중..." : "신청"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
