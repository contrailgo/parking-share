import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { LotId } from "@/lib/mockRoster";

// POST /api/spots/cancel
// body: { lot, spotNumber, date, pin }
// 본인 확인용 비밀번호로 취소.
// Request가 있으면(파랑/보라) 그 신청자의 비밀번호와 대조해서 Request만 삭제(초록으로 복귀).
// Request가 없으면(초록) 등록자 비밀번호와 대조해서 Vacancy 자체를 삭제(회색으로 복귀).
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { lot, spotNumber, date, pin } = body as {
    lot?: LotId;
    spotNumber?: number;
    date?: string;
    pin?: string;
  };

  if (!lot || !spotNumber || !date || !pin) {
    return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 });
  }

  const vacancy = await prisma.vacancy.findUnique({
    where: { lot_spotNumber_date: { lot, spotNumber, date } },
    include: { request: true },
  });

  if (!vacancy) {
    return NextResponse.json(
      { error: "취소할 수 있는 자리가 아닙니다" },
      { status: 404 }
    );
  }

  if (vacancy.request) {
    if (pin !== vacancy.request.pin) {
      return NextResponse.json(
        { error: "비밀번호가 일치하지 않습니다" },
        { status: 403 }
      );
    }
    await prisma.request.delete({ where: { id: vacancy.request.id } });
    return NextResponse.json({ result: "claim_cancelled" });
  }

  if (pin !== vacancy.pin) {
    return NextResponse.json(
      { error: "비밀번호가 일치하지 않습니다" },
      { status: 403 }
    );
  }
  await prisma.vacancy.delete({ where: { id: vacancy.id } }); // Request도 cascade로 같이 삭제됨
  return NextResponse.json({ result: "vacancy_cancelled" });
}
