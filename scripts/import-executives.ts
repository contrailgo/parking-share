// data/임원_명단.xlsx (날짜 없는 고정 파일)를 읽어서 Executive 테이블을 통째로 교체함.
// 실행: npm run executives:import
// 파일을 교체한 뒤 이 명령어만 다시 치면 임원 명단이 전체 갱신됨 (버전 이력 안 남김).

import fs from "node:fs";
import path from "node:path";
import { parseExecutiveExcel } from "../lib/parseExecutiveExcel";
import { replaceExecutives } from "../lib/replaceExecutives";

const EXECUTIVE_FILE_PATH = path.join(
  process.cwd(),
  "data",
  "임원_명단.xlsx"
);

async function main() {
  if (!fs.existsSync(EXECUTIVE_FILE_PATH)) {
    console.error(`파일을 찾을 수 없습니다: ${EXECUTIVE_FILE_PATH}`);
    console.error("data 폴더에 '임원_명단.xlsx' 이름으로 엑셀 파일을 넣어주세요.");
    process.exit(1);
  }

  const buffer = fs.readFileSync(EXECUTIVE_FILE_PATH);
  const { executives, counts } = parseExecutiveExcel(buffer);

  if (counts.lobby === 0 && counts.basement === 0) {
    console.error(
      "임원 명단을 찾을 수 없습니다. 엑셀 형식(로비/신관 열 구조)을 확인해 주세요."
    );
    process.exit(1);
  }

  await replaceExecutives(executives);

  console.log(
    `임원 명단 업데이트 완료 - 로비 ${counts.lobby}명 / 신관(지하1층) ${counts.basement}명`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
