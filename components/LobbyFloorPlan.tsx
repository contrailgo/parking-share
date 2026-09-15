"use client";

import type { SpotStatus } from "./FloorPlan";

// 로비 주차장을 단순화한 그리드
// 왼쪽 세로열 8자리 + 하단 가로열 11자리 = 총 19자리
// 도면상 실제 이름은 무시하고 순번(1~19)으로 관리함 (mockRoster의 로비 내부 배정자와 매핑)
//
// FloorPlan(신관)과 동일하게 상단/하단 그리드를 분리해서 렌더링함 - 신관과 세로 높이를
// 맞추기 위해 상단 그리드의 행 높이 배열을 FloorPlan과 동일하게 사용함.

type Spot = {
  number: number;
  col: number;
  row: number;
};

const UPPER_SPOTS: Spot[] = [
  { number: 1, col: 1, row: 1 },
  { number: 2, col: 1, row: 3 },
  { number: 3, col: 1, row: 4 },
  { number: 4, col: 1, row: 5 },
  { number: 5, col: 1, row: 7 },
  { number: 6, col: 1, row: 8 },
  { number: 7, col: 1, row: 10 },
  { number: 8, col: 1, row: 11 },
];

const BOTTOM_SPOTS: Spot[] = [
  { number: 9, col: 1, row: 1 },
  { number: 10, col: 2, row: 1 },
  { number: 11, col: 3, row: 1 },
  { number: 12, col: 4, row: 1 },
  { number: 13, col: 5, row: 1 },
  { number: 14, col: 6, row: 1 },
  { number: 15, col: 7, row: 1 },
  { number: 16, col: 8, row: 1 },
  { number: 17, col: 9, row: 1 },
  { number: 18, col: 10, row: 1 },
  { number: 19, col: 11, row: 1 },
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
  function renderSpot(spot: Spot) {
    const status = spotStatuses[spot.number];
    const isVacant = status === "vacant";
    const isClaimedExternal = status === "claimed_external";
    const isClaimedWaiting = status === "claimed_waiting";
    const isClickable = cancelMode
      ? status !== undefined
      : isVacant || isClaimedExternal;

    const bgColor = isVacant
      ? "#10b981"
      : isClaimedExternal
      ? "#2563eb"
      : isClaimedWaiting
      ? "#8b5cf6"
      : "#374151";

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
        onClick={isClickable ? () => onSpotClick?.(spot.number) : undefined}
        title={tooltip}
        className={`rounded-md text-xs font-medium text-white flex items-center justify-center transition-all duration-150 font-mono-numeric ${
          isClickable
            ? "cursor-pointer hover:scale-110 hover:shadow-md hover:z-10"
            : "cursor-default opacity-80"
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
  }

  return (
    <>
      <div className="overflow-x-auto">
        <div
          className="grid gap-1 mx-auto"
          style={{
            gridTemplateColumns: "repeat(9, minmax(36px, 1fr))",
            gridTemplateRows:
              "34px 16px 34px 34px 34px 16px 34px 34px 16px 34px 34px 34px",
            minWidth: "500px",
          }}
        >
          {/* 로비 영역 (라운지/엘리베이터 등) - 클릭 불가 */}
          <div
            className="rounded-md bg-gray-300"
            style={{ gridColumn: "3 / span 7", gridRow: "1 / span 8" }}
          />

          {UPPER_SPOTS.map(renderSpot)}
        </div>

        <div
          className="grid gap-1 mx-auto mt-4"
          style={{
            gridTemplateColumns: "repeat(11, minmax(36px, 1fr))",
            gridTemplateRows: "34px",
            minWidth: "580px",
          }}
        >
          {BOTTOM_SPOTS.map(renderSpot)}
        </div>
      </div>
    </>
  );
}
