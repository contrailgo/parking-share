import { NextRequest, NextResponse } from "next/server";
import { importRosterVersion } from "@/lib/replaceRoster";
import type { Employee } from "@/lib/mockRoster";

// POST /api/roster/upload
// body: { effectiveDate, employees } - 클라이언트에서 엑셀을 이미 파싱해서 보냄
// effectiveDate("YYYY-MM-DD")는 이 명단을 몇 월 며칠 예약분부터 적용할지를 뜻함.
// (현재 웹 화면에는 이 기능을 쓰는 버튼이 없고, CLI의 npm run roster:import를 씀)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const employees = body.employees as Employee[] | undefined;
  const effectiveDate = body.effectiveDate as string | undefined;

  if (!effectiveDate || !/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate)) {
    return NextResponse.json(
      { error: "effectiveDate가 YYYY-MM-DD 형식으로 필요합니다" },
      { status: 400 }
    );
  }
  if (!Array.isArray(employees) || employees.length === 0) {
    return NextResponse.json(
      { error: "명단 데이터가 비어 있습니다" },
      { status: 400 }
    );
  }

  const counts = await importRosterVersion(effectiveDate, employees);
  return NextResponse.json({ counts });
}
