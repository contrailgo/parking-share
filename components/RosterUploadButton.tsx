"use client";

import { useRef, useState } from "react";
import { parseRosterExcel } from "@/lib/parseRosterExcel";
import { useRoster } from "@/lib/RosterContext";

export default function RosterUploadButton({
  onResult,
}: {
  onResult: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { replaceRoster } = useRoster();
  const [isLoading, setIsLoading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // 같은 파일 다시 선택해도 onChange 다시 뜨게

    if (!file) return;

    setIsLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      const { employees, counts } = parseRosterExcel(buffer);

      if (counts.internal === 0 && counts.external === 0 && counts.waiting === 0) {
        onResult(
          "명단을 찾을 수 없습니다. 엑셀 형식(신관/외부/아세아도/대기 열 구조)을 확인해 주십시오."
        );
        return;
      }

      replaceRoster(employees);
      onResult(
        `명단 업데이트 완료 - 신관 ${counts.internal}명 / 외부 ${counts.external}명 / 대기 ${counts.waiting}명`
      );
    } catch {
      onResult("엑셀 파일을 읽는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isLoading}
        className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
      >
        {isLoading ? "명단 읽는 중..." : "명단 업로드"}
      </button>
    </>
  );
}
