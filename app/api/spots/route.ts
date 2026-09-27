import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { LotId } from "@/lib/mockRoster";

// GET /api/spots?lot=basement&date=2026-09-04
// 해당 주차장·날짜의 모든 자리 상태를 반환함.
// 상태는 별도 컬럼이 아니라 Vacancy/Request 존재 여부로 그때그때 계산함:
//   Vacancy 없음        -> "none" (평상시, 회색)
//   Vacancy 있음, Request 없음 -> "vacant" (초록)
//   Vacancy+Request(EXTERNAL)  -> "claimed_external" (파랑)
//   Vacancy+Request(WAITING)   -> "claimed_waiting" (보라)
export async function GET(req: NextRequest) {
  const lot = req.nextUrl.searchParams.get("lot") as LotId | null;
  const date = req.nextUrl.searchParams.get("date");

  if (!lot || !date) {
    return NextResponse.json(
      { error: "lot, date 쿼리 파라미터가 필요합니다" },
      { status: 400 }
    );
  }

  const vacancies = await prisma.vacancy.findMany({
    where: { lot, date },
    include: { request: true },
  });

  const spots: Record<
    number,
    { status: "vacant" | "claimed_waiting" | "claimed_external"; applicantName?: string }
  > = {};

  for (const v of vacancies) {
    if (!v.request) {
      spots[v.spotNumber] = { status: "vacant" };
    } else {
      spots[v.spotNumber] = {
        status:
          v.request.applicantType === "WAITING"
            ? "claimed_waiting"
            : "claimed_external",
        applicantName: v.request.applicantName,
      };
    }
  }

  return NextResponse.json({ spots });
}
