import { prisma } from "@/lib/prisma";
import type { Employee } from "@/lib/mockRoster";
import type { Prisma } from "@prisma/client";

// 임원 명단을 통째로 교체함 (버전/날짜 개념 없음 - 항상 "현재 상태" 하나만 존재).
// 새 임원 파일을 넣으면 기존 Executive 데이터를 전부 지우고 새로 채워넣음.
export async function replaceExecutives(executives: Employee[]) {
  const counts = { lobby: 0, basement: 0 };
  for (const e of executives) {
    if (e.lot === "lobby") counts.lobby++;
    else if (e.lot === "basement") counts.basement++;
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.executive.deleteMany({});
    await tx.executive.createMany({
      data: executives.map((e) => ({
        name: e.name,
        lot: e.lot as "basement" | "lobby",
        spotNumber: e.spotNumber as number,
      })),
    });
  });

  return counts;
}
