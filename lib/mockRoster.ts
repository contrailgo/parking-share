// 실제 명단 반영 (주차장_배정_2025년_하반기_-_추첨_결과_2025-06-27.xlsx 기준)
// 신관(내부, 43명) / 외부(50명) / 대기(4명, 05~15는 빈 슬롯이라 제외)
// + 로비 주차장(내부, 19명) - 실제 이름 대신 순번(1~19)으로 임시 처리
// TODO: DB 연결 시 Prisma seed로 이전

export type EmployeeType = "INTERNAL" | "EXTERNAL" | "WAITING";
export type LotId = "basement" | "lobby";

export type Employee = {
  name: string;
  type: EmployeeType;
  spotNumber?: number; // 내부 배정자인 경우에만 존재
  lot?: LotId; // 내부 배정자가 어느 주차장 소속인지. 생략 시 "basement"(지하1층 신관)
};

const INTERNAL_ROSTER: Employee[] = [
  { name: "이상광", type: "INTERNAL", spotNumber: 1, lot: "basement" },
  { name: "황수현", type: "INTERNAL", spotNumber: 2, lot: "basement" },
  { name: "조성진", type: "INTERNAL", spotNumber: 3, lot: "basement" },
  { name: "진은경", type: "INTERNAL", spotNumber: 4, lot: "basement" },
  { name: "윤세령", type: "INTERNAL", spotNumber: 5, lot: "basement" },
  { name: "김동일", type: "INTERNAL", spotNumber: 6, lot: "basement" },
  { name: "한제희", type: "INTERNAL", spotNumber: 7, lot: "basement" },
  { name: "오성모", type: "INTERNAL", spotNumber: 8, lot: "basement" },
  { name: "이새결", type: "INTERNAL", spotNumber: 9, lot: "basement" },
  { name: "권오기", type: "INTERNAL", spotNumber: 10, lot: "basement" },
  { name: "박진열", type: "INTERNAL", spotNumber: 11, lot: "basement" },
  { name: "이강수", type: "INTERNAL", spotNumber: 12, lot: "basement" },
  { name: "최강혁", type: "INTERNAL", spotNumber: 13, lot: "basement" },
  { name: "유준상", type: "INTERNAL", spotNumber: 14, lot: "basement" },
  { name: "김솔미", type: "INTERNAL", spotNumber: 15, lot: "basement" },
  { name: "오대한", type: "INTERNAL", spotNumber: 16, lot: "basement" },
  { name: "김채은", type: "INTERNAL", spotNumber: 17, lot: "basement" },
  { name: "박지연", type: "INTERNAL", spotNumber: 18, lot: "basement" },
  { name: "송준철", type: "INTERNAL", spotNumber: 19, lot: "basement" },
  { name: "조소영", type: "INTERNAL", spotNumber: 20, lot: "basement" },
  { name: "성두제", type: "INTERNAL", spotNumber: 21, lot: "basement" },
  { name: "한지혜", type: "INTERNAL", spotNumber: 22, lot: "basement" },
  { name: "피재우", type: "INTERNAL", spotNumber: 23, lot: "basement" },
  { name: "정순용", type: "INTERNAL", spotNumber: 24, lot: "basement" },
  { name: "남지효", type: "INTERNAL", spotNumber: 25, lot: "basement" },
  { name: "오슬", type: "INTERNAL", spotNumber: 26, lot: "basement" },
  { name: "장욱", type: "INTERNAL", spotNumber: 27, lot: "basement" },
  { name: "한재준", type: "INTERNAL", spotNumber: 28, lot: "basement" },
  { name: "홍영수", type: "INTERNAL", spotNumber: 29, lot: "basement" },
  { name: "이종건", type: "INTERNAL", spotNumber: 30, lot: "basement" },
  { name: "허순철", type: "INTERNAL", spotNumber: 31, lot: "basement" },
  { name: "최우진", type: "INTERNAL", spotNumber: 32, lot: "basement" },
  { name: "김상훈", type: "INTERNAL", spotNumber: 33, lot: "basement" },
  { name: "박상윤", type: "INTERNAL", spotNumber: 34, lot: "basement" },
  { name: "정성훈", type: "INTERNAL", spotNumber: 35, lot: "basement" },
  { name: "최지원", type: "INTERNAL", spotNumber: 36, lot: "basement" },
  { name: "서주연", type: "INTERNAL", spotNumber: 37, lot: "basement" },
  { name: "조성온", type: "INTERNAL", spotNumber: 38, lot: "basement" },
  { name: "김성하", type: "INTERNAL", spotNumber: 39, lot: "basement" },
  { name: "김주범", type: "INTERNAL", spotNumber: 40, lot: "basement" },
  { name: "백교훈", type: "INTERNAL", spotNumber: 41, lot: "basement" },
  { name: "김영덕", type: "INTERNAL", spotNumber: 42, lot: "basement" },
  { name: "허남중", type: "INTERNAL", spotNumber: 43, lot: "basement" },
];

// 로비 주차장 - 왼쪽 세로열 8자리 + 하단 가로열 11자리 = 19자리
// 실제 이름(최승무, 김정석 등)은 아직 반영 안 하고 순번(1~19)으로 임시 처리
const LOBBY_INTERNAL_ROSTER: Employee[] = Array.from(
  { length: 19 },
  (_, i) => ({
    name: String(i + 1),
    type: "INTERNAL" as const,
    spotNumber: i + 1,
    lot: "lobby" as const,
  })
);

const EXTERNAL_ROSTER: Employee[] = [
  "조민지", "정주희", "김정호", "이원범", "김정훈", "이은혜", "김현철", "신중수",
  "현재하", "한기학", "김주엽", "송병진", "송치강", "최무원", "이영준", "안용수",
  "강성문", "백동광", "한봉효", "김찬희", "백현철", "김출기", "권민재", "박은솔",
  "유은석", "윤학노", "이한일", "조동기", "최은진", "최유성", "이정민", "안태양",
  "최현국", "이재호", "이우창", "김진수", "이상균", "서창원", "백지운", "손원미",
  "김교신", "김광진", "최은영", "권오진", "정우성", "김영진", "이승연", "이은숙",
  "강승천", "서충현",
  // 아세아도 01~16 - 외부 배정자로 취급
  "김동인", "임연철", "황리아", "김규동", "최재혁", "한형희", "이호", "박찬희",
  "오상건", "신강호", "박준홍", "서강득", "최승우", "우종필", "서호일", "박종호",
].map((name) => ({ name, type: "EXTERNAL" as const }));

const WAITING_ROSTER: Employee[] = [
  { name: "박재영", type: "WAITING" },
  { name: "이민호", type: "WAITING" },
  { name: "김상춘", type: "WAITING" },
  { name: "한우현", type: "WAITING" },
  // 대기 05~15는 현재 빈 슬롯이라 명단 없음
];

export const MOCK_ROSTER: Employee[] = [
  ...INTERNAL_ROSTER,
  ...LOBBY_INTERNAL_ROSTER,
  ...EXTERNAL_ROSTER,
  ...WAITING_ROSTER,
];

export function findEmployeeByName(name: string): Employee | undefined {
  return MOCK_ROSTER.find((e) => e.name === name.trim());
}
