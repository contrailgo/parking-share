import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 이름으로 임직원 조회 → 내부/외부/대기자 여부 판별
// 로그인 없이, 이름 입력값을 명단과 대조하는 방식
export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name");

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  // TODO: 명단 파일 구조 확정 후 실제 조회 로직 구현
  const employee = await prisma.employee.findUnique({ where: { name } });

  if (!employee) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json(employee);
}
