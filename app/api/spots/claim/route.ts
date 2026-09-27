import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { isWaitingOverrideAllowed } from "@/lib/deadline";
import { findEmployeeForDate } from "@/lib/resolveEmployee";
import type { LotId } from "@/lib/mockRoster";

// POST /api/spots/claim
// body: { lot, spotNumber, date, name, pin }
// 빈자리(초록)에 신청하거나, 대기자가 외부배정자의 신청(파랑)을 우선예약으로 가져옴.
// 명단 조회는 신청 대상 날짜(date)에 적용되는 명단 버전 기준으로 함.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { lot, spotNumber, date, name, pin } = body as {
    lot?: LotId;
    spotNumber?: number;
    date?: string;
    name?: string;
    pin?: string;
  };

  if (!lot || !spotNumber || !date) {
    return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 });
  }
  if (!name?.trim()) {
    return NextResponse.json({ error: "이름을 입력해 주십시오" }, { status: 400 });
  }
  if (!pin || !/^\d{4}$/.test(pin)) {
    return NextResponse.json(
      { error: "비밀번호는 숫자 4자리로 입력해 주십시오" },
      { status: 400 }
    );
  }

  const employee = await findEmployeeForDate(name.trim(), date);

  if (!employee) {
    return NextResponse.json({ error: "명단에 없는 이름입니다" }, { status: 404 });
  }
  if (employee.type === "INTERNAL") {
    return NextResponse.json(
      { error: "내부 배정자는 다른 자리를 신청할 수 없습니다" },
      { status: 403 }
    );
  }

  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const vacancy = await tx.vacancy.findUnique({
        where: { lot_spotNumber_date: { lot, spotNumber, date } },
        include: { request: true },
      });

      if (!vacancy) {
        throw new Error("이미 신청된 자리입니다");
      }

      if (employee.type === "EXTERNAL") {
        // 외부 배정자는 진짜 빈자리(신청 없음)일 때만 가능
        if (vacancy.request) {
          throw new Error("이미 신청된 자리입니다");
        }
      } else {
        // WAITING: 빈자리이거나, 외부배정자가 신청한 자리를 가져올 수 있음
        // 단, 이미 대기자가 확정된 자리는 불가
        if (vacancy.request?.applicantType === "WAITING") {
          throw new Error("이미 신청된 자리입니다");
        }
        if (
          vacancy.request?.applicantType === "EXTERNAL" &&
          !isWaitingOverrideAllowed(date)
        ) {
          throw new Error("대기자 우선예약은 전날 16:00까지만 가능합니다");
        }
      }

      await tx.request.upsert({
        where: { vacancyId: vacancy.id },
        create: {
          vacancyId: vacancy.id,
          applicantName: employee.name,
          applicantType: employee.type,
          pin,
        },
        update: {
          applicantName: employee.name,
          applicantType: employee.type,
          pin,
        },
      });
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "신청에 실패했습니다";
    return NextResponse.json({ error: message }, { status: 409 });
  }

  return NextResponse.json({ name: employee.name, type: employee.type });
}
