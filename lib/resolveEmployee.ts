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

// 특정 날짜 기준으로 적용되는 명단 버전에서 이름으로 직원을 찾음.
// register/claim API가 이걸 통해 "그 예약 날짜 시점에 유효했던 명단"으로 확인함.
export async function findEmployeeForDate(name: string, date: string) {
  const version = await resolveRosterVersion(date);
  if (!version) return null;

  return prisma.employee.findUnique({
    where: {
      rosterVersionId_name: {
        rosterVersionId: version.id,
        name: name.trim(),
      },
    },
  });
}
