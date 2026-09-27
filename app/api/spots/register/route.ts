import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { findEmployeeForDate } from "@/lib/resolveEmployee";

const MAX_RANGE_DAYS = 90;

// 날짜 문자열을 직접 파싱해서 UTC 정수 연산으로 처리 (로컬 타임존 변환 시 하루씩 밀리는 문제 방지)
function enumerateDates(start: string, end: string): string[] {
  const result: string[] = [];
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  let cur = Date.UTC(sy, sm - 1, sd);
  const endUTC = Date.UTC(ey, em - 1, ed);
  while (cur <= endUTC) {
    const d = new Date(cur);
    result.push(
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
        d.getUTCDate()
      ).padStart(2, "0")}`
    );
    cur += 24 * 60 * 60 * 1000;
  }
  return result;
}

// POST /api/spots/register
// body: { name, pin, startDate, endDate }
// 이름으로 명단에서 내부 배정자를 찾아서, 그 사람 소유 자리(spotNumber+lot)를
// startDate~endDate 범위 전체에 대해 "빈자리 등록"(Vacancy 생성)함.
//
// 명단 조회는 startDate 시점에 적용되는 명단 버전 기준으로 함 - 등록 기간이
// 명단 버전 교체 시점을 걸치는 경우는 흔치 않다고 보고 단순화함.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, pin, startDate, endDate } = body as {
    name?: string;
    pin?: string;
    startDate?: string;
    endDate?: string;
  };

  if (!name?.trim()) {
    return NextResponse.json({ error: "이름을 입력해 주십시오" }, { status: 400 });
  }
  if (!pin || !/^\d{4}$/.test(pin)) {
    return NextResponse.json(
      { error: "비밀번호는 숫자 4자리로 입력해 주십시오" },
      { status: 400 }
    );
  }
  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: "시작일과 종료일을 모두 선택해 주십시오" },
      { status: 400 }
    );
  }
  if (endDate < startDate) {
    return NextResponse.json(
      { error: "종료일은 시작일보다 빠를 수 없습니다" },
      { status: 400 }
    );
  }

  const dates = enumerateDates(startDate, endDate);
  if (dates.length > MAX_RANGE_DAYS) {
    return NextResponse.json(
      { error: `한 번에 최대 ${MAX_RANGE_DAYS}일까지 등록할 수 있습니다` },
      { status: 400 }
    );
  }

  const employee = await findEmployeeForDate(name.trim(), startDate);

  if (!employee) {
    return NextResponse.json({ error: "명단에 없는 이름입니다" }, { status: 404 });
  }
  if (employee.type !== "INTERNAL" || employee.spotNumber == null) {
    return NextResponse.json(
      { error: "내부 배정자만 자리를 등록할 수 있습니다" },
      { status: 403 }
    );
  }

  const lot = employee.lot ?? "basement";
  const spotNumber = employee.spotNumber;

  // 트랜잭션: 범위 내 하루라도 이미 등록되어 있으면 전체를 취소하고 에러 반환
  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const existing = await tx.vacancy.findMany({
        where: { lot, spotNumber, date: { in: dates } },
        select: { date: true },
      });
      if (existing.length > 0) {
        throw new Error(
          `이미 ${existing[0].date}에 등록된 자리입니다 (${
            lot === "lobby" ? "로비" : "신관"
          } ${spotNumber}번)`
        );
      }
      await tx.vacancy.createMany({
        data: dates.map((date) => ({
          lot,
          spotNumber,
          date,
          employeeName: employee.name,
          pin,
        })),
      });
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "등록에 실패했습니다";
    return NextResponse.json({ error: message }, { status: 409 });
  }

  return NextResponse.json({
    name: employee.name,
    lot,
    spotNumber,
    dates,
  });
}
