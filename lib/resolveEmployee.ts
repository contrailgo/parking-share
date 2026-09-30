import { prisma } from "@/lib/prisma";

// 주어진 날짜(date)에 적용해야 할 명단 버전을 찾음:
// - date 이전(또는 같은) 버전 중 가장 최근(effectiveDate가 가장 큰) 것을 사용
// - 만약 그 date보다 이전 버전이 하나도 없으면(아주 옛날 날짜 등), 있는 버전 중
//   가장 이른 것으로 폴백함 (아예 명단이 없는 것보다는 낫다고 판단)
export async function resolveRosterVersion(date: string) {
  const versionAtOrBefore = await prisma.rosterVersion.findFirst({
    where: { effectiveDate: { lte: date } },
    orderBy: { effectiveDate: "desc" },
  });
  if (versionAtOrBefore) return versionAtOrBefore;

  return prisma.rosterVersion.findFirst({
    orderBy: { effectiveDate: "asc" },
  });
}

// 이름으로 직원을 찾음. 날짜(date)는 일반 명단(RosterVersion) 조회에만 쓰이고,
// 임원(Executive)은 날짜와 무관하게 항상 최우선으로 확인함 - 임원 명단은
// 반기별 명단 교체 주기와 별개로 관리되기 때문.
export async function findEmployeeForDate(name: string, date: string) {
  const trimmed = name.trim();

  const executive = await prisma.executive.findUnique({
    where: { name: trimmed },
  });
  if (executive) {
    return {
      name: executive.name,
      type: "INTERNAL" as const,
      lot: executive.lot,
      spotNumber: executive.spotNumber,
    };
  }

  const version = await resolveRosterVersion(date);
  if (!version) return null;

  return prisma.employee.findUnique({
    where: {
      rosterVersionId_name: {
        rosterVersionId: version.id,
        name: trimmed,
      },
    },
  });
}
