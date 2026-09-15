"use client";

// 지하 1층 주차장 배치도를 단순화한 그리드
// 실제 CAD 도면(__주차장_배치도_지하.pptx)의 상대적 배치를 유지하되,
// 사각형 그리드로 간소화함. 신관(내부 배정자) 1~43번 자리에 대응.
//
// 위쪽(1~18번 등) 그리드는 12열 x 12행. 코어/장애인/38라인/1라인은 원래 위치 그대로 고정하고,
// 39라인(왼쪽 안쪽 줄)/10라인(오른쪽 안쪽 줄)만 코어에 바로 붙여서, 38↔39 사이·10↔1 사이에
// 빈 간격이 생기도록 함. 최하단 가로열(30~19)은 그룹 간격(30,29 / 28,27,26 / 25,24,23 / 22,21,20,19)을
// 위해 별도의 15열 그리드로 완전히 분리해서 렌더링함 (위쪽 그리드의 코어 크기에 영향 없게).

type Spot = {
  number: number;
  col: number;
  row: number;
};

// 위쪽 그리드 (12열, 코어는 원래 위치(4~8열) 그대로 고정)
// 38라인(1열)/1라인(12열)은 원래 자리 그대로 두고, 39라인만 3열, 10라인만 9열로 옮겨서
// 코어에 바로 붙임 - 그 결과 38↔39 사이(2열), 10↔1 사이(10,11열)에 빈 간격이 생김
const UPPER_SPOTS: Spot[] = [
  // 왼쪽 세로열 - 단일 (38 최상단, 32/31 은 통로 아래 별도 블록) - 원래 자리 그대로
  { number: 38, col: 1, row: 1 },
  { number: 32, col: 1, row: 10 },
  { number: 31, col: 1, row: 11 },
  // 왼쪽 세로열 - 바깥줄(37~33)은 원래 자리, 안쪽줄(39~43)만 코어에 붙임
  { number: 37, col: 1, row: 3 },
  { number: 39, col: 3, row: 3 },
  { number: 36, col: 1, row: 4 },
  { number: 40, col: 3, row: 4 },
  { number: 35, col: 1, row: 5 },
  { number: 41, col: 3, row: 5 },
  { number: 34, col: 1, row: 7 },
  { number: 42, col: 3, row: 7 },
  { number: 33, col: 1, row: 8 },
  { number: 43, col: 3, row: 8 },

  // 오른쪽 세로열 - 10라인(코어에 붙임)
  { number: 10, col: 9, row: 1 },
  { number: 11, col: 9, row: 3 },
  { number: 12, col: 9, row: 4 },
  { number: 13, col: 9, row: 5 },
  { number: 14, col: 9, row: 7 },
  { number: 15, col: 9, row: 8 },
  // 오른쪽 세로열 - 1라인(원래 자리 그대로, 12열)
  { number: 1, col: 12, row: 1 },
  { number: 2, col: 12, row: 3 },
  { number: 3, col: 12, row: 4 },
  { number: 4, col: 12, row: 5 },
  { number: 5, col: 12, row: 7 },
  { number: 6, col: 12, row: 8 },
  // 오른쪽 하단 단일열 (7,8,9) - 1라인과 같은 열
  { number: 7, col: 12, row: 10 },
  { number: 8, col: 12, row: 11 },
  { number: 9, col: 12, row: 12 },

  // 32/7 과 같은 줄에 위치 (15번=9열 바로 아래를 피해서 코어 안쪽 열에 배치)
  { number: 18, col: 5, row: 10 },
  { number: 17, col: 6, row: 10 },
  { number: 16, col: 7, row: 10 },
];

// 최하단 가로열 - 별도 그리드 (15열: 3,7,11번 열은 그룹 구분용 얇은 여백 열)
// 도면처럼 30,29 / 28,27,26 / 25,24,23 / 22,21,20,19 네 그룹으로 나뉨
const BOTTOM_SPOTS: Spot[] = [
  { number: 30, col: 1, row: 1 },
  { number: 29, col: 2, row: 1 },
  { number: 28, col: 4, row: 1 },
  { number: 27, col: 5, row: 1 },
  { number: 26, col: 6, row: 1 },
  { number: 25, col: 8, row: 1 },
  { number: 24, col: 9, row: 1 },
  { number: 23, col: 10, row: 1 },
  { number: 22, col: 12, row: 1 },
  { number: 21, col: 13, row: 1 },
  { number: 20, col: 14, row: 1 },
  { number: 19, col: 15, row: 1 },
];

export type SpotStatus = "vacant" | "claimed_waiting" | "claimed_external";

export default function FloorPlan({
  date,
  spotStatuses = {},
  spotNames = {},
  cancelMode = false,
  overrideAllowed = true,
  onSpotClick,
}: {
  date: string;
  spotStatuses?: Record<number, SpotStatus>;
  spotNames?: Record<number, string>; // 신청자 이름 (보라/파랑 상태일 때 호버 툴팁용)
  cancelMode?: boolean; // true면 등록/신청된 모든 자리(초록/파랑/보라)를 클릭해서 취소할 수 있음
  overrideAllowed?: boolean; // false면 파랑(외부배정자 신청됨) 자리는 대기자도 가로챌 수 없음 (전날 16:00 마감)
  onSpotClick?: (spotNumber: number) => void;
}) {
  function renderSpot(spot: Spot) {
    const status = spotStatuses[spot.number];
    const isVacant = status === "vacant";
    const isClaimedExternal = status === "claimed_external";
    const isClaimedWaiting = status === "claimed_waiting";
    // 평소: 초록(빈자리)은 누구나, 파랑(외부배정자 신청됨)은 대기자가 우선예약 가능해서 클릭 가능
    //   단, 우선예약은 전날 16:00 마감이라 그 이후엔 눌러도 안내만 뜨고 실제 신청은 안 됨(page.tsx에서 분기)
    // 취소모드: 등록/신청된 자리(초록/파랑/보라) 전부 클릭해서 취소 가능
    const isClickable = cancelMode
      ? status !== undefined
      : isVacant || isClaimedExternal;

    // 평상시(등록 안 됨) = 짙은 회색 / 대기자 신청 = 보라 / 외부배정자 신청 = 파랑 / 빈자리 = 초록
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
        {/* 위쪽 (1~18번 등) - 12열 그리드. 코어(4~8열)/장애인/38라인(1열)/1라인(12열)은
            원래 위치 그대로 고정, 39라인(3열)/10라인(9열)만 코어에 붙임 */}
        <div
          className="grid gap-1 mx-auto"
          style={{
            gridTemplateColumns: "repeat(12, minmax(36px, 1fr))",
            gridTemplateRows:
              "34px 16px 34px 34px 34px 16px 34px 34px 16px 34px 34px 34px",
            minWidth: "640px",
          }}
        >
          {/* 코어 영역 (계단/설비/로비) - 클릭 불가, 원래 위치(4~8열) 그대로 고정 */}
          <div
            className="rounded-md bg-gray-300"
            style={{ gridColumn: "4 / span 5", gridRow: "1 / span 5" }}
          />

          {/* 장애인 전용 구역 - 클릭 불가, 원래 위치 그대로 고정 */}
          <div
            className="rounded-md bg-green-100 border border-green-300 flex items-center justify-center text-[11px] text-green-800 text-center leading-tight"
            style={{ gridColumn: "4 / span 1", gridRow: "7 / span 2" }}
          >
            장애인
          </div>
          <div
            className="rounded-md bg-green-100 border border-green-300 flex items-center justify-center text-[11px] text-green-800 text-center leading-tight"
            style={{ gridColumn: "6 / span 1", gridRow: "7 / span 2" }}
          >
            장애인
          </div>

          {UPPER_SPOTS.map(renderSpot)}
        </div>

        {/* 최하단 가로열 - 별도 그리드, 위쪽 그리드와 무관하게 그룹 간격만 신경씀 */}
        <div
          className="grid gap-1 mx-auto mt-4"
          style={{
            gridTemplateColumns:
              "minmax(36px,1fr) minmax(36px,1fr) 16px minmax(36px,1fr) minmax(36px,1fr) minmax(36px,1fr) 16px minmax(36px,1fr) minmax(36px,1fr) minmax(36px,1fr) 16px minmax(36px,1fr) minmax(36px,1fr) minmax(36px,1fr) minmax(36px,1fr)",
            gridTemplateRows: "34px",
            minWidth: "680px",
          }}
        >
          {BOTTOM_SPOTS.map(renderSpot)}
        </div>
      </div>
    </>
  );
}
