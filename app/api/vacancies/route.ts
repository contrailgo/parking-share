import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: 특정 날짜의 빈 자리 목록 조회 (평면도 렌더링용)
export async function GET(req: NextRequest) {
  const dateParam = req.nextUrl.searchParams.get("date");

  if (!dateParam) {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }

  // TODO: 마감시각(전날 16:00) 체크 로직 추가
  const vacancies = await prisma.vacancy.findMany({
    where: { date: new Date(dateParam) },
    include: { spot: true, owner: true, requests: true },
  });

  return NextResponse.json(vacancies);
}

// POST: 내부 배정자가 빈 날짜 등록
export async function POST(req: NextRequest) {
  const body = await req.json();

  // TODO: 이름 -> employee 조회 (로그인 없는 방식)
  // TODO: 마감시각(전날 16:00) 이후 등록 차단 로직
  // TODO: body: { name, spotId, date }

  return NextResponse.json({ message: "not implemented", body }, { status: 501 });
}
