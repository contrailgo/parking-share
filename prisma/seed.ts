// 초기 명단 시딩 스크립트. 로컬 DB를 처음 만들 때 한 번 실행:
//   npx prisma db seed
// lib/mockRoster.ts의 기본 명단을, "2025-07-01부터 적용"이라는 기본 버전 하나로 넣어둠.
// 이미 그 버전이 있으면 건드리지 않음.

import { PrismaClient } from "@prisma/client";
import { DEFAULT_ROSTER } from "../lib/mockRoster";
import { importRosterVersion } from "../lib/replaceRoster";

const prisma = new PrismaClient();
const DEFAULT_EFFECTIVE_DATE = "2025-07-01";

async function main() {
  const existing = await prisma.rosterVersion.findUnique({
    where: { effectiveDate: DEFAULT_EFFECTIVE_DATE },
  });
  if (existing) {
    console.log(
      `이미 ${DEFAULT_EFFECTIVE_DATE} 버전이 있어서 시딩을 건너뜁니다.`
    );
    return;
  }

  // DEFAULT_ROSTER는 로비 명단까지 이미 포함하고 있으니, 여기서는 로비를 뺀
  // (신관/외부/대기만 있는) 목록을 만들어서 넘김 - importRosterVersion이
  // 로비 명단을 알아서 다시 붙여주기 때문에 중복 방지 차원
  const withoutLobby = DEFAULT_ROSTER.filter((e) => e.lot !== "lobby");

  const counts = await importRosterVersion(
    DEFAULT_EFFECTIVE_DATE,
    withoutLobby,
    "default (하드코딩된 기본 명단)"
  );

  console.log(
    `기본 명단 시딩 완료 (적용 시작일 ${DEFAULT_EFFECTIVE_DATE}) - 신관 ${counts.internal}명 / 외부 ${counts.external}명 / 대기 ${counts.waiting}명`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
