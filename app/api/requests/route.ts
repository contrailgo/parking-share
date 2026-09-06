import { NextRequest, NextResponse } from "next/server";

// POST: 빈 자리 신청 (대기자/외부 배정자)
export async function POST(req: NextRequest) {
  const body = await req.json();

  // TODO: 이름 -> employee 조회, type(대기자/외부배정자) 판별
  // TODO: 마감시각(전날 16:00) 체크
  // TODO: 마감 시 배정 로직 - 대기자 그룹 선착순 우선 처리 후 외부배정자 그룹 선착순

  return NextResponse.json({ message: "not implemented", body }, { status: 501 });
}
