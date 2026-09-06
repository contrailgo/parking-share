// 대기자의 우선예약(외부배정자가 이미 신청한 파란 자리에 대신 신청하는 것)은
// 전날 오후 4시(16:00)까지만 가능함. 그 이후엔 일반 신청(빈자리 신청)은 계속 가능하되,
// 이미 선점된 자리를 가져오는 것만 막힘.
// TODO: 빈자리 등록/일반 신청 자체의 마감시각(전날 16:00) 로직은 아직 별도 미구현

export function getPriorDayDeadline(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  // new Date는 day=0 이하로 내려가도 알아서 이전 달로 굴러가므로 d-1로 계산해도 안전함
  return new Date(y, m - 1, d - 1, 16, 0, 0, 0);
}

export function isWaitingOverrideAllowed(
  dateStr: string,
  now: Date = new Date()
): boolean {
  return now <= getPriorDayDeadline(dateStr);
}
