import * as XLSX from "xlsx";
import type { Employee } from "@/lib/mockRoster";

// 임원_명단.xlsx 형식 파싱 (날짜 없는 파일, 항상 현재 상태로만 관리됨)
// 열 구조: B(번호)/C(이름) = 로비, E(번호)/F(이름) = 지하 1층
// sheet_to_json(header:1)은 실제 데이터가 있는 첫 열(B열)부터 배열 인덱스 0으로 잡음
// (A열이 비어있어서 통째로 스킵됨) - 그래서 0-based로 B=0,C=1, E=3,F=4

function extractNumber(label: unknown): number | null {
  if (typeof label !== "string" && typeof label !== "number") return null;
  const str = String(label);
  const match = str.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

export function parseExecutiveExcel(input: ArrayBuffer | Buffer): {
  executives: Employee[];
  counts: { lobby: number; basement: number };
} {
  const isArrayBuffer = input instanceof ArrayBuffer;
  const workbook = isArrayBuffer
    ? XLSX.read(input, { type: "array" })
    : XLSX.read(input, { type: "buffer" });

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
  }) as unknown[][];

  const executives: Employee[] = [];
  let lobbyCount = 0;
  let basementCount = 0;

  for (const row of rows) {
    const lobbyLabel = row[0];
    const lobbyName = row[1];
    const basementLabel = row[3];
    const basementName = row[4];

    const lobbyNum = extractNumber(lobbyLabel);
    if (lobbyNum !== null && typeof lobbyName === "string" && lobbyName.trim()) {
      executives.push({
        name: lobbyName.trim(),
        type: "INTERNAL",
        lot: "lobby",
        spotNumber: lobbyNum,
      });
      lobbyCount++;
    }

    const basementNum = extractNumber(basementLabel);
    if (
      basementNum !== null &&
      typeof basementName === "string" &&
      basementName.trim()
    ) {
      executives.push({
        name: basementName.trim(),
        type: "INTERNAL",
        lot: "basement",
        spotNumber: basementNum,
      });
      basementCount++;
    }
  }

  return {
    executives,
    counts: { lobby: lobbyCount, basement: basementCount },
  };
}
