import * as XLSX from "xlsx";
import type { Employee } from "@/lib/mockRoster";

// 주차장_배정_..._결과.xlsx 형식 파싱
// 열 구조: B/C=외부, E/F=신관(내부), H/I=아세아도(외부로 취급), K/L=대기
// 라벨 형식: "외부01", "신관 01", "아세아도 01", "대기 01" (공백 유무 섞여있어도 처리)

function extractNumber(label: unknown): number | null {
  if (typeof label !== "string") return null;
  const match = label.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

export function parseRosterExcel(buffer: ArrayBuffer): {
  employees: Employee[];
  counts: { internal: number; external: number; waiting: number };
} {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
  }) as unknown[][];

  const employees: Employee[] = [];
  let internalCount = 0;
  let externalCount = 0;
  let waitingCount = 0;

  for (const row of rows) {
    // sheet_to_json(header:1)은 실제 데이터가 있는 첫 열(B열)부터 배열 인덱스 0으로 잡음
    // (A열이 비어있어서 통째로 스킵됨) - 그래서 0-based로 B=0,C=1, E=3,F=4, H=6,I=7, K=9,L=10
    const externalLabel = row[0];
    const externalName = row[1];
    const internalLabel = row[3];
    const internalName = row[4];
    const asiaLabel = row[6]; // 아세아도 - 외부로 취급
    const asiaName = row[7];
    const waitingLabel = row[9];
    const waitingName = row[10];

    if (
      typeof externalName === "string" &&
      externalName.trim() &&
      typeof externalLabel === "string" &&
      externalLabel.includes("외부")
    ) {
      employees.push({ name: externalName.trim(), type: "EXTERNAL" });
      externalCount++;
    }

    if (
      typeof internalName === "string" &&
      internalName.trim() &&
      typeof internalLabel === "string" &&
      internalLabel.includes("신관")
    ) {
      const spotNumber = extractNumber(internalLabel);
      if (spotNumber !== null) {
        employees.push({
          name: internalName.trim(),
          type: "INTERNAL",
          spotNumber,
          lot: "basement",
        });
        internalCount++;
      }
    }

    if (
      typeof asiaName === "string" &&
      asiaName.trim() &&
      typeof asiaLabel === "string" &&
      asiaLabel.includes("아세아도")
    ) {
      employees.push({ name: asiaName.trim(), type: "EXTERNAL" });
      externalCount++;
    }

    if (
      typeof waitingName === "string" &&
      waitingName.trim() &&
      typeof waitingLabel === "string" &&
      waitingLabel.includes("대기")
    ) {
      employees.push({ name: waitingName.trim(), type: "WAITING" });
      waitingCount++;
    }
  }

  return {
    employees,
    counts: {
      internal: internalCount,
      external: externalCount,
      waiting: waitingCount,
    },
  };
}
