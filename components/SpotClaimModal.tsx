"use client";

import { useState } from "react";
import { findEmployeeByName } from "@/lib/mockRoster";

type Props = {
  date: string;
  spotNumber: number;
  waitingOnly: boolean; // true면 이미 외부배정자가 신청한 자리 - 대기자만 가로챌 수 있음
  onClose: () => void;
  onClaim: (args: {
    spotNumber: number;
    name: string;
    type: "WAITING" | "EXTERNAL";
    pin: string;
  }) => { success: boolean; error?: string };
};

export default function SpotClaimModal({
  date,
  spotNumber,
  waitingOnly,
  onClose,
  onClaim,
}: Props) {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmed = name.trim();
    if (!trimmed) {
      setError("이름을 입력해 주십시오");
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      setError("비밀번호는 숫자 4자리로 입력해 주십시오");
      return;
    }

    const employee = findEmployeeByName(trimmed);

    if (!employee) {
      setError("명단에 없는 이름입니다");
      return;
    }

    if (employee.type === "INTERNAL") {
      setError("내부 배정자는 다른 자리를 신청할 수 없습니다");
      return;
    }

    if (waitingOnly && employee.type !== "WAITING") {
      setError("이미 외부 배정자가 신청한 자리이므로 대기자만 우선신청이 가능합니다");
      return;
    }

    // 제출 시점에 다시 한 번 최신 상태 확인 (입력하는 사이 다른 사람이 먼저 채갔을 수 있음)
    const result = onClaim({
      spotNumber,
      name: employee.name,
      type: employee.type,
      pin,
    });

    if (!result.success) {
      setError(result.error ?? "신청에 실패했습니다");
      return;
    }

    // 성공 시 부모 컴포넌트가 모달을 닫음
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

        <form onSubmit={handleSubmit}>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder="이름"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6022A7]"
          />

          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
              setError(null);
            }}
            placeholder="비밀번호 설정(4자리)"
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
              className="flex-1 px-4 py-2 rounded-lg bg-[#6022A7] hover:bg-[#4f1c89] text-white text-sm font-medium"
            >
              신청
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
