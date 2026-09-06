"use client";

import type { SpotStatus } from "./FloorPlan";

// 로비 주차장을 단순화한 그리드
// 왼쪽 세로열 8자리 + 하단 가로열 11자리 = 총 19자리
// 도면상 실제 이름은 무시하고 순번(1~19)으로 관리함 (mockRoster의 로비 내부 배정자와 매핑)

type Spot = {
  number: number;
  col: number;
  row: number;
};

const SPOTS: Spot[] = [
  // 왼쪽 세로열 (1~8) - 지하1층 신관과 같은 12행 템플릿 기준, 7행(spacer)은 건너뜀
  { number: 1, col: 1, row: 1 },
  { number: 2, col: 1, row: 2 },
  { number: 3, col: 1, row: 3 },
  { number: 4, col: 1, row: 4 },
  { number: 5, col: 1, row: 5 },
  { number: 6, col: 1, row: 6 },
  { number: 7, col: 1, row: 8 },
  { number: 8, col: 1, row: 9 },
  // 최하단 가로열 (9~19) - 신관과 동일하게 12행(맨 아래)에 배치
  { number: 9, col: 1, row: 12 },
  { number: 10, col: 2, row: 12 },
  { number: 11, col: 3, row: 12 },
  { number: 12, col: 4, row: 12 },
  { number: 13, col: 5, row: 12 },
  { number: 14, col: 6, row: 12 },
  { number: 15, col: 7, row: 12 },
  { number: 16, col: 8, row: 12 },
  { number: 17, col: 9, row: 12 },
  { number: 18, col: 10, row: 12 },
  { number: 19, col: 11, row: 12 },
];

export default function LobbyFloorPlan({
  date,
  spotStatuses = {},
  spotNames = {},
  cancelMode = false,
  overrideAllowed = true,
  onSpotClick,
}: {
  date: string;
  spotStatuses?: Record<number, SpotStatus>;
  spotNames?: Record<number, string>;
  cancelMode?: boolean;
  overrideAllowed?: boolean; // false면 파랑(외부배정자 신청됨) 자리는 대기자도 가로챌 수 없음 (전날 16:00 마감)
  onSpotClick?: (spotNumber: number) => void;
}) {
  return (
    <>
      <div className="overflow-x-auto">
        <div
          className="grid gap-1 mx-auto"
          style={{
            gridTemplateColumns: "repeat(11, minmax(36px, 1fr))",
            gridTemplateRows:
              "34px 34px 34px 34px 34px 34px 16px 34px 34px 34px 16px 34px",
            minWidth: "560px",
          }}
        >
          {/* 로비 영역 (라운지/엘리베이터 등) - 클릭 불가 */}
          <div
            className="rounded-md bg-gray-300"
            style={{ gridColumn: "3 / span 7", gridRow: "1 / span 6" }}
          />

          {SPOTS.map((spot) => {
            const status = spotStatuses[spot.number];
            const isVacant = status === "vacant";
            const isClaimedExternal = status === "claimed_external";
            const isClaimedWaiting = status === "claimed_waiting";
            const isClickable = cancelMode
              ? status !== undefined
              : isVacant || isClaimedExternal;

            const bgColor = isVacant
              ? "#10b981" // emerald-500
              : isClaimedExternal
              ? "#2563eb" // blue-600
              : isClaimedWaiting
              ? "#8b5cf6" // violet-500
              : "#374151"; // gray-700

            const tooltip = isClaimedWaiting
              ? spotNames[spot.number] ?? "신청자 정보 없음"
              : isClaimedExternal
              ? overrideAllowed
                ? spotNames[spot.number] ?? "신청자 정보 없음"
                : `${spotNames[spot.number] ?? "신청자 정보 없음"} (대기자 우선예약은 전날 16:00까지만 가능합니다)`
              : undefined;

            return (
              <button
                key={spot.number}
                type="button"
                disabled={!isClickable}
                onClick={
                  isClickable ? () => onSpotClick?.(spot.number) : undefined
                }
                title={tooltip}
                className={`rounded-md text-xs font-medium text-white flex items-center justify-center transition-all duration-150 font-mono-numeric ${
                  isClickable ? "cursor-pointer hover:scale-110 hover:shadow-md hover:z-10" : "cursor-default opacity-80"
                }`}
                style={{
                  gridColumn: spot.col,
                  gridRow: spot.row,
                  backgroundColor: bgColor,
                }}
              >
                {spot.number}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-4 mt-4 text-xs text-gray-500 justify-center flex-wrap">
        <span className="flex items-center gap-1">
          <span
            className="w-3 h-3 rounded-sm inline-block"
            style={{ backgroundColor: "#8b5cf6" }}
          />
          대기자 신청
        </span>
        <span className="flex items-center gap-1">
          <span
            className="w-3 h-3 rounded-sm inline-block"
            style={{ backgroundColor: "#2563eb" }}
          />
          외부 배정자 신청
        </span>
        <span className="flex items-center gap-1">
          <span
            className="w-3 h-3 rounded-sm inline-block"
            style={{ backgroundColor: "#10b981" }}
          />
          빈자리
        </span>
      </div>
    </>
  );
}
