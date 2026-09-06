"use client";

// 지하 1층 주차장 배치도를 단순화한 그리드
// 실제 CAD 도면(__주차장_배치도_지하.pptx)의 상대적 배치를 유지하되,
// 사각형 그리드로 간소화함. 신관(내부 배정자) 1~43번 자리에 대응.
//
// 아직 상태(빈자리/신청가능/마감 등) 로직은 없음 - 모양만 잡아둔 단계.

type Spot = {
  number: number;
  col: number; // 1-based grid column
  row: number; // 1-based grid row
};

// 도면상 위치를 그대로 옮긴 좌표 (12열 x 12행 그리드, 7행/11행은 통로 여백용 spacer)
const SPOTS: Spot[] = [
  // 왼쪽 세로열 - 단일 (38 최상단, 32/31 은 통로 아래 별도 블록)
  { number: 38, col: 1, row: 1 },
  { number: 32, col: 1, row: 8 },
  { number: 31, col: 1, row: 9 },
  // 왼쪽 세로열 - 바깥/안쪽 줄 쌍 (37~33 / 39~43)
  { number: 37, col: 1, row: 2 },
  { number: 39, col: 2, row: 2 },
  { number: 36, col: 1, row: 3 },
  { number: 40, col: 2, row: 3 },
  { number: 35, col: 1, row: 4 },
  { number: 41, col: 2, row: 4 },
  { number: 34, col: 1, row: 5 },
  { number: 42, col: 2, row: 5 },
  { number: 33, col: 1, row: 6 },
  { number: 43, col: 2, row: 6 },

  // 오른쪽 세로열 - 바깥쪽 줄 (10,11,12,13,14,15)
  { number: 10, col: 11, row: 1 },
  { number: 11, col: 11, row: 2 },
  { number: 12, col: 11, row: 3 },
  { number: 13, col: 11, row: 4 },
  { number: 14, col: 11, row: 5 },
  { number: 15, col: 11, row: 6 },
  // 오른쪽 세로열 - 안쪽 줄 (1,2,3,4,5,6)
  { number: 1, col: 12, row: 1 },
  { number: 2, col: 12, row: 2 },
  { number: 3, col: 12, row: 3 },
  { number: 4, col: 12, row: 4 },
  { number: 5, col: 12, row: 5 },
  { number: 6, col: 12, row: 6 },
  // 오른쪽 하단 단일열 (7,8,9) - 통로 아래 별도 블록, 왼쪽(32/31)보다 한 칸 더 있음
  { number: 7, col: 12, row: 8 },
  { number: 8, col: 12, row: 9 },
  { number: 9, col: 12, row: 10 },

  // 32/7 과 같은 줄에 위치하되, 15번 바로 아래(11열)를 피해서 왼쪽으로 거리를 둠
  { number: 18, col: 7, row: 8 },
  { number: 17, col: 8, row: 8 },
  { number: 16, col: 9, row: 8 },

  // 최하단 가로열 - 통로 하나 더 건너 맨 아래 (왼쪽 -> 오른쪽: 30,29,28,27,26,25,24,23,22,21,20,19)
  { number: 30, col: 1, row: 12 },
  { number: 29, col: 2, row: 12 },
  { number: 28, col: 3, row: 12 },
  { number: 27, col: 4, row: 12 },
  { number: 26, col: 5, row: 12 },
  { number: 25, col: 6, row: 12 },
  { number: 24, col: 7, row: 12 },
  { number: 23, col: 8, row: 12 },
  { number: 22, col: 9, row: 12 },
  { number: 21, col: 10, row: 12 },
  { number: 20, col: 11, row: 12 },
  { number: 19, col: 12, row: 12 },
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
  return (
    <>
      <div className="overflow-x-auto">
        <div
          className="grid gap-1 mx-auto"
          style={{
            gridTemplateColumns: "repeat(12, minmax(36px, 1fr))",
            gridTemplateRows:
              "34px 34px 34px 34px 34px 34px 16px 34px 34px 34px 16px 34px",
            minWidth: "600px",
          }}
        >
          {/* 코어 영역 (계단/설비/로비) - 클릭 불가, 세로길이 축소 */}
          <div
            className="rounded-md bg-gray-300"
            style={{ gridColumn: "4 / span 5", gridRow: "1 / span 4" }}
          />

          {/* 장애인 전용 구역 - 클릭 불가, 코어 바로 아래 짧게 배치 (16/17/18과는 spacer행 하나만큼 떨어짐) */}
          <div
            className="rounded-md bg-green-100 border border-green-300 flex items-center justify-center text-[11px] text-green-800 text-center leading-tight"
            style={{ gridColumn: "4 / span 1", gridRow: "5 / span 2" }}
          >
            장애인
          </div>
          <div
            className="rounded-md bg-green-100 border border-green-300 flex items-center justify-center text-[11px] text-green-800 text-center leading-tight"
            style={{ gridColumn: "6 / span 1", gridRow: "5 / span 2" }}
          >
            장애인
          </div>

          {/* 신관 1~43 주차면 - 상태에 따라 3가지 색상, 빈자리만 클릭 가능 */}
          {/* Tailwind 클래스 대신 인라인 색상코드 사용 (캐시/JIT 인식 문제 방지) */}
          {SPOTS.map((spot) => {
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

            // 평상시(등록 안 됨) = 짙은 회색
            // 대기자가 신청함 = 보라색
            // 외부 배정자가 신청함 = 파랑
            // 빈자리(신청 가능) = 초록
            const bgColor = isVacant
              ? "#10b981" // emerald-500
              : isClaimedExternal
              ? "#2563eb" // blue-600
              : isClaimedWaiting
              ? "#8b5cf6" // violet-500
              : "#374151"; // gray-700

            // 신청자 이름 - 보라(대기자 신청)/파랑(외부배정자 신청) 상태일 때만 호버 툴팁으로 표시
            // 파랑인데 우선예약 마감 지났으면 안내문구도 같이 보여줌
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
