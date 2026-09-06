"use client";

import { useState } from "react";
import { findEmployeeByName, LotId } from "@/lib/mockRoster";

type Props = {
  defaultDate: string;
  isSpotRegistered: (spotNumber: number, date: string, lot: LotId) => boolean;
  onRegister: (
    spotNumber: number,
    name: string,
    dates: string[],
    pin: string,
    lot: LotId
  ) => void;
};

const MAX_RANGE_DAYS = 90;

function enumerateDates(start: string, end: string): string[] {
  // 로컬 타임존 변환(toISOString 등)을 거치면 UTC+9 등에서 하루씩 밀리는 문제가 있어서
  // 날짜를 직접 파싱해서 UTC 기준 정수 연산으로만 처리함 (종료일 포함, inclusive)
  const result: string[] = [];
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  let cur = Date.UTC(sy, sm - 1, sd);
  const endUTC = Date.UTC(ey, em - 1, ed);

  while (cur <= endUTC) {
    const d = new Date(cur);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    result.push(`${yyyy}-${mm}-${dd}`);
    cur += 24 * 60 * 60 * 1000; // 하루씩 증가 (UTC 기준이라 DST 영향 없음)
  }

  return result;
}

export default function VacancyRegisterButton({
  defaultDate,
  isSpotRegistered,
  onRegister,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [startDate, setStartDate] = useState(defaultDate);
  const [endDate, setEndDate] = useState(defaultDate);
  const [error, setError] = useState<string | null>(null);

  function openModal() {
    setStartDate(defaultDate);
    setEndDate(defaultDate);
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
    setName("");
    setPin("");
    setError(null);
  }

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

    if (!startDate || !endDate) {
      setError("시작일과 종료일을 모두 선택해 주십시오");
      return;
    }

    if (endDate < startDate) {
      setError("종료일은 시작일보다 빠를 수 없습니다");
      return;
    }

    const dates = enumerateDates(startDate, endDate);

    if (dates.length > MAX_RANGE_DAYS) {
      setError(`한 번에 최대 ${MAX_RANGE_DAYS}일까지 등록할 수 있습니다`);
      return;
    }

    const employee = findEmployeeByName(trimmed);

    if (!employee) {
      setError("명단에 없는 이름입니다");
      return;
    }

    if (employee.type !== "INTERNAL" || employee.spotNumber === undefined) {
      setError("내부 배정자만 자리를 등록할 수 있습니다");
      return;
    }

    const lot: LotId = employee.lot ?? "basement";
    const lotLabel = lot === "lobby" ? "로비" : "신관";

    const conflictDate = dates.find((d) =>
      isSpotRegistered(employee.spotNumber as number, d, lot)
    );

    if (conflictDate) {
      setError(
        `이미 ${conflictDate}에 등록된 자리입니다 (${lotLabel} ${employee.spotNumber}번)`
      );
      return;
    }

    onRegister(employee.spotNumber, employee.name, dates, pin, lot);
    closeModal();
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="px-4 py-2 rounded-lg bg-[#6022A7] hover:bg-[#4f1c89] text-white text-sm font-medium transition-colors"
      >
        빈자리 등록
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              빈자리 등록
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              자리를 비우려는 기간과 이름을 입력해 주십시오.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="flex gap-2 mb-2">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">
                    시작일
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setError(null);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6022A7]"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">
                    종료일
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setError(null);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6022A7]"
                  />
                </div>
              </div>

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
                placeholder="비밀번호 4자리 (취소할 때 필요해요)"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6022A7]"
              />

              {error && (
                <p className="text-sm text-red-600 mb-2">{error}</p>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-[#6022A7] hover:bg-[#4f1c89] text-white text-sm font-medium"
                >
                  등록
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
