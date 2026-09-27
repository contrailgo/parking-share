import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { LotId } from "@/lib/mockRoster";

// TODO: 지금은 관리자 비밀번호가 .env의 평문 값과 단순 비교됨.
// 실제 운영 전에는 세션/쿠키 기반 인증 등으로 교체 필요 - 지금은 프로토타입이라 임시 처리.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "1234";

// POST /api/spots/admin-cancel
// body: { lot, spotNumber, date, adminPassword }
// 등록자/신청자 비밀번호 확인 없이, 관리자 비밀번호만 맞으면 바로 취소함.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { lot, spotNumber, date, adminPassword } = body as {
    lot?: LotId;
    spotNumber?: number;
    date?: string;
    adminPassword?: string;
  };

  if (adminPassword !== ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "관리자 비밀번호가 일치하지 않습니다" },
      { status: 403 }
    );
  }

  if (!lot || !spotNumber || !date) {
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
    await prisma.request.delete({ where: { id: vacancy.request.id } });
    return NextResponse.json({ result: "claim_cancelled" });
  }

  await prisma.vacancy.delete({ where: { id: vacancy.id } });
  return NextResponse.json({ result: "vacancy_cancelled" });
}
