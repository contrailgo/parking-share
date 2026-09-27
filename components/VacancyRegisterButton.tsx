"use client";

import { useState } from "react";

type Props = {
  defaultDate: string;
  onRegistered: () => void; // 성공 시 부모가 자리 목록을 다시 불러오도록 알림
};

export default function VacancyRegisterButton({
  defaultDate,
  onRegistered,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [startDate, setStartDate] = useState(defaultDate);
  const [endDate, setEndDate] = useState(defaultDate);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function openModal() {
    setName("");
    setPin("");
    setError(null);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/spots/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          pin,
          startDate,
          endDate,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "등록에 실패했습니다");
        return;
      }

      onRegistered();
      closeModal();
    } catch {
      setError("서버와 통신 중 오류가 발생했습니다");
    } finally {
      setIsSubmitting(false);
    }
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

            <form onSubmit={handleSubmit} autoComplete="off">
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
                name="vacancy-register-name"
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
                name="vacancy-register-pin"
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
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 rounded-lg bg-[#6022A7] hover:bg-[#4f1c89] text-white text-sm font-medium disabled:opacity-50"
                >
                  {isSubmitting ? "등록 중..." : "등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
