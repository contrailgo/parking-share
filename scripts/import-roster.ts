// data/ 폴더 전체를 한 번에 스캔해서, 파일 종류를 자동으로 구분해 반영함:
//   - "YYYY_MM_DD_아무이름.xlsx" 형식 -> 일반 명단, 파일명의 날짜를 effectiveDate로 삼아 버전 등록
//   - "임원_명단.xlsx" (정확히 이 이름) -> 임원 명단, 날짜 없이 전체 교체
//   - 그 외 .xlsx 파일 -> 인식 못 하는 파일이라 건너뜀 (경고만 출력)
//
// 실행: npm run roster:import
// 새 명단을 추가하든, 기존 파일을 수정하든 이 명령어 하나만 다시 치면 됨.

import fs from "node:fs";
import path from "node:path";
import { parseRosterExcel } from "../lib/parseRosterExcel";
import { importRosterVersion } from "../lib/replaceRoster";
import { parseExecutiveExcel } from "../lib/parseExecutiveExcel";
import { replaceExecutives } from "../lib/replaceExecutives";

const DATA_DIR = path.join(process.cwd(), "data");
const DATED_FILENAME_PATTERN = /^(\d{4})_(\d{2})_(\d{2})_.*\.xlsx$/;
const EXECUTIVE_FILENAME = "임원_명단.xlsx";

async function importDatedRosterFile(file: string, match: RegExpMatchArray) {
  const [, y, m, d] = match;
  const effectiveDate = `${y}-${m}-${d}`;

  const buffer = fs.readFileSync(path.join(DATA_DIR, file));
  const { employees, counts } = parseRosterExcel(buffer);

  if (counts.internal === 0 && counts.external === 0 && counts.waiting === 0) {
    console.warn(
      `[건너뜀] ${file}: 명단을 찾을 수 없습니다 (엑셀 형식을 확인해 주세요)`
    );
    return;
  }

  await importRosterVersion(effectiveDate, employees, file);

  console.log(
    `[반영됨] ${file} -> 일반 명단, 적용 시작일 ${effectiveDate} - 신관 ${counts.internal}명 / 외부 ${counts.external}명 / 대기 ${counts.waiting}명`
  );
}

async function importExecutiveFile(file: string) {
  const buffer = fs.readFileSync(path.join(DATA_DIR, file));
  const { executives, counts } = parseExecutiveExcel(buffer);

  if (counts.lobby === 0 && counts.basement === 0) {
    console.warn(
      `[건너뜀] ${file}: 임원 명단을 찾을 수 없습니다 (엑셀 형식을 확인해 주세요)`
    );
    return;
  }

  await replaceExecutives(executives);

  console.log(
    `[반영됨] ${file} -> 임원 명단(날짜 없음, 전체 교체) - 로비 ${counts.lobby}명 / 신관(지하1층) ${counts.basement}명`
  );
}

async function main() {
  if (!fs.existsSync(DATA_DIR)) {
    console.error(`data 폴더를 찾을 수 없습니다: ${DATA_DIR}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.toLowerCase().endsWith(".xlsx"));

  if (files.length === 0) {
    console.error("data 폴더에 .xlsx 파일이 하나도 없습니다.");
    process.exit(1);
  }

  let handled = 0;

  for (const file of files) {
    const datedMatch = file.match(DATED_FILENAME_PATTERN);

    if (datedMatch) {
      await importDatedRosterFile(file, datedMatch);
      handled++;
    } else if (file === EXECUTIVE_FILENAME) {
      await importExecutiveFile(file);
      handled++;
    } else {
      console.warn(
        `[건너뜀] ${file}: 이름 형식을 인식할 수 없습니다.\n` +
          `  일반 명단은 "YYYY_MM_DD_이름.xlsx", 임원 명단은 정확히 "${EXECUTIVE_FILENAME}"이어야 합니다.`
      );
    }
  }

  console.log(`총 ${handled}개 파일 반영 완료. (건너뛴 파일은 위 경고 참고)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
