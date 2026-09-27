// data/ 폴더 안의 "YYYY_MM_DD_아무이름.xlsx" 형식 파일들을 전부 스캔해서
// 각각을 하나의 명단 버전(effectiveDate = 파일명의 날짜)으로 DB에 반영함.
// 실행: npm run roster:import
// 새 버전을 추가하려면: data 폴더에 "2026_01_07_주차장_배정_명단.xlsx" 같은 이름으로
// 파일을 넣고 이 명령어만 다시 치면 됨. 이미 있는 날짜의 파일을 다시 돌리면
// 그 버전의 내용만 최신 파일 기준으로 갱신됨 (재실행 안전함).

import fs from "node:fs";
import path from "node:path";
import { parseRosterExcel } from "../lib/parseRosterExcel";
import { importRosterVersion } from "../lib/replaceRoster";

const DATA_DIR = path.join(process.cwd(), "data");
const FILENAME_PATTERN = /^(\d{4})_(\d{2})_(\d{2})_.*\.xlsx$/;

async function main() {
  if (!fs.existsSync(DATA_DIR)) {
    console.error(`data 폴더를 찾을 수 없습니다: ${DATA_DIR}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => FILENAME_PATTERN.test(f));

  if (files.length === 0) {
    console.error(
      "data 폴더에 'YYYY_MM_DD_이름.xlsx' 형식의 명단 파일이 하나도 없습니다."
    );
    console.error(
      "예: data/2026_01_07_주차장_배정_명단.xlsx"
    );
    process.exit(1);
  }

  for (const file of files) {
    const match = file.match(FILENAME_PATTERN);
    if (!match) continue; // 타입 좁히기용 (위 filter로 이미 걸러짐)

    const [, y, m, d] = match;
    const effectiveDate = `${y}-${m}-${d}`;

    const buffer = fs.readFileSync(path.join(DATA_DIR, file));
    const { employees, counts } = parseRosterExcel(buffer);

    if (counts.internal === 0 && counts.external === 0 && counts.waiting === 0) {
      console.warn(
        `[건너뜀] ${file}: 명단을 찾을 수 없습니다 (엑셀 형식을 확인해 주세요)`
      );
      continue;
    }

    await importRosterVersion(effectiveDate, employees, file);

    console.log(
      `[반영됨] ${file} -> 적용 시작일 ${effectiveDate} - 신관 ${counts.internal}명 / 외부 ${counts.external}명 / 대기 ${counts.waiting}명`
    );
  }

  console.log(`총 ${files.length}개 명단 버전 반영 완료.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
