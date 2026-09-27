import { prisma } from "@/lib/prisma";
import type { Employee } from "@/lib/mockRoster";
import { LOBBY_ROSTER } from "@/lib/mockRoster";
import type { Prisma } from "@prisma/client";

// 명단 버전 하나를 통째로 생성(또는 갱신)함.
// - effectiveDate가 같은 버전이 이미 있으면 그 버전의 직원 데이터만 갈아끼움 (재실행 가능)
// - 로비(lot="lobby") 명단은 엑셀에 없는 정보라, 모든 버전에 항상 동일하게 포함시킴
export async function importRosterVersion(
  effectiveDate: string,
  employees: Employee[],
  sourceFile?: string
) {
  const counts = { internal: 0, external: 0, waiting: 0 };
  for (const e of employees) {
    if (e.type === "INTERNAL") counts.internal++;
    else if (e.type === "EXTERNAL") counts.external++;
    else if (e.type === "WAITING") counts.waiting++;
  }

  const fullEmployees = [...employees, ...LOBBY_ROSTER];

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const version = await tx.rosterVersion.upsert({
      where: { effectiveDate },
      create: { effectiveDate, sourceFile },
      update: { sourceFile },
    });

    await tx.employee.deleteMany({ where: { rosterVersionId: version.id } });
    await tx.employee.createMany({
      data: fullEmployees.map((e) => ({
        name: e.name,
        type: e.type,
        lot: e.lot ?? null,
        spotNumber: e.spotNumber ?? null,
        rosterVersionId: version.id,
      })),
    });

    return version;
  });

  return counts;
}
