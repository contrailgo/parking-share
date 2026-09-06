"use client";

import { useEffect, useState } from "react";
import FloorPlan, { SpotStatus } from "@/components/FloorPlan";
import LobbyFloorPlan from "@/components/LobbyFloorPlan";
import VacancyRegisterButton from "@/components/VacancyRegisterButton";
import SpotClaimModal from "@/components/SpotClaimModal";
import CancelModal from "@/components/CancelModal";
import type { LotId } from "@/lib/mockRoster";
import { isWaitingOverrideAllowed } from "@/lib/deadline";

type VacancyInfo = { name: string; pin: string }; // 빈자리 등록한 내부 배정자 정보
type ClaimInfo = {
  name: string;
  type: "WAITING" | "EXTERNAL";
  pin: string;
}; // 그 빈자리를 신청한 사람 정보

type LotState<T> = Record<LotId, Record<string, Record<number, T>>>;

function todayString() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

const EMPTY_LOT_STATE = { basement: {}, lobby: {} };

export default function Home() {
  const [date, setDate] = useState(todayString());

  // 주차장(신관/로비)별·날짜별 상태. 새로고침하면 초기화되는 임시 상태.
  // TODO: DB 연결 시 Vacancy/Request 테이블 조회로 교체 (비밀번호는 해시로 저장해야 함)
  const [statusesByLot, setStatusesByLot] = useState<LotState<SpotStatus>>(
    EMPTY_LOT_STATE
  );
  const [vacancyByLot, setVacancyByLot] = useState<LotState<VacancyInfo>>(
    EMPTY_LOT_STATE
  );
  const [claimByLot, setClaimByLot] = useState<LotState<ClaimInfo>>(
    EMPTY_LOT_STATE
  );

  function statusesFor(lot: LotId) {
    return statusesByLot[lot][date] ?? {};
  }

  function namesFor(lot: LotId) {
    const claims = claimByLot[lot][date] ?? {};
    return Object.fromEntries(
      Object.entries(claims).map(([num, claim]) => [num, claim.name])
    );
  }

  const [selectedSpot, setSelectedSpot] = useState<
    { lot: LotId; spotNumber: number } | null
  >(null);
  const [cancelMode, setCancelMode] = useState(false);
  const [cancelSpot, setCancelSpot] = useState<
    { lot: LotId; spotNumber: number } | null
  >(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  function setSpotStatus(
    lot: LotId,
    dateStr: string,
    spotNumber: number,
    status: SpotStatus
  ) {
    setStatusesByLot((prev) => ({
      ...prev,
      [lot]: {
        ...prev[lot],
        [dateStr]: { ...(prev[lot][dateStr] ?? {}), [spotNumber]: status },
      },
    }));
  }

  function setVacancy(
    lot: LotId,
    dateStr: string,
    spotNumber: number,
    info: VacancyInfo
  ) {
    setVacancyByLot((prev) => ({
      ...prev,
      [lot]: {
        ...prev[lot],
        [dateStr]: { ...(prev[lot][dateStr] ?? {}), [spotNumber]: info },
      },
    }));
  }

  function setClaim(
    lot: LotId,
    dateStr: string,
    spotNumber: number,
    info: ClaimInfo
  ) {
    setClaimByLot((prev) => ({
      ...prev,
      [lot]: {
        ...prev[lot],
        [dateStr]: { ...(prev[lot][dateStr] ?? {}), [spotNumber]: info },
      },
    }));
  }

  function clearClaim(lot: LotId, dateStr: string, spotNumber: number) {
    setClaimByLot((prev) => {
      const dayMap = { ...(prev[lot][dateStr] ?? {}) };
      delete dayMap[spotNumber];
      return { ...prev, [lot]: { ...prev[lot], [dateStr]: dayMap } };
    });
  }

  // 빈자리 등록 자체를 취소 - 등록/신청 정보를 전부 지워서 완전히 원래(회색) 상태로 되돌림
  function clearVacancy(lot: LotId, dateStr: string, spotNumber: number) {
    setStatusesByLot((prev) => {
      const dayMap = { ...(prev[lot][dateStr] ?? {}) };
      delete dayMap[spotNumber];
      return { ...prev, [lot]: { ...prev[lot], [dateStr]: dayMap } };
    });
    setVacancyByLot((prev) => {
      const dayMap = { ...(prev[lot][dateStr] ?? {}) };
      delete dayMap[spotNumber];
      return { ...prev, [lot]: { ...prev[lot], [dateStr]: dayMap } };
    });
    clearClaim(lot, dateStr, spotNumber);
  }

  function isSpotRegistered(
    spotNumber: number,
    dateStr: string,
    lot: LotId
  ): boolean {
    return statusesByLot[lot][dateStr]?.[spotNumber] !== undefined;
  }

  function handleRegister(
    spotNumber: number,
    name: string,
    dates: string[],
    pin: string,
    lot: LotId
  ) {
    dates.forEach((d) => {
      setSpotStatus(lot, d, spotNumber, "vacant");
      setVacancy(lot, d, spotNumber, { name, pin });
    });
    const lotLabel = lot === "lobby" ? "로비" : "신관";
    console.log(
      `${name}님의 ${lotLabel} ${spotNumber}번 자리를 ${dates[0]}~${
        dates[dates.length - 1]
      }에 등록함`
    );
    setToast(
      dates.length === 1
        ? `${dates[0]} ${lotLabel} ${spotNumber}번 자리가 등록됐어요!`
        : `${dates[0]}~${dates[dates.length - 1]} ${lotLabel} ${spotNumber}번 자리가 등록됐어요!`
    );
  }

  function handleClaim({
    spotNumber,
    name,
    type,
    pin,
  }: {
    spotNumber: number;
    name: string;
    type: "WAITING" | "EXTERNAL";
    pin: string;
  }): { success: boolean; error?: string } {
    if (!selectedSpot) {
      return { success: false, error: "신청할 자리가 선택되지 않았습니다" };
    }
    const lot = selectedSpot.lot;
    // 모달을 연 시점 이후로 다른 사람이 먼저 채갔을 수 있으니 최신 상태로 다시 확인
    const currentStatus = statusesByLot[lot][date]?.[spotNumber];

    if (type === "EXTERNAL") {
      // 외부 배정자는 자리가 여전히 빈자리(vacant)일 때만 신청 가능
      if (currentStatus !== "vacant") {
        return { success: false, error: "이미 신청된 자리입니다" };
      }
      setSpotStatus(lot, date, spotNumber, "claimed_external");
    } else {
      // 대기자는 빈자리이거나, 외부배정자가 신청한 자리를 가로챌 수 있음
      // 단, 이미 대기자가 확정된 자리는 안 됨
      if (currentStatus !== "vacant" && currentStatus !== "claimed_external") {
        return { success: false, error: "이미 신청된 자리입니다" };
      }
      // 대기자 우선예약(외부배정자가 신청한 자리에 대신 신청하는 것)은 전날 16:00까지만 가능
      if (
        currentStatus === "claimed_external" &&
        !isWaitingOverrideAllowed(date)
      ) {
        return {
          success: false,
          error: "대기자 우선예약은 전날 16:00까지만 가능합니다",
        };
      }
      setSpotStatus(lot, date, spotNumber, "claimed_waiting");
    }
    setClaim(lot, date, spotNumber, { name, type, pin });

    console.log(`${name}(${type})님이 ${lot} ${spotNumber}번을 ${date}에 신청함`);
    setToast(`${name}님, ${spotNumber}번 자리가 예약됐어요!`);
    setSelectedSpot(null);
    return { success: true };
  }

  function handleCancel(pin: string): { success: boolean; error?: string } {
    if (cancelSpot === null) {
      return { success: false, error: "취소할 자리가 선택되지 않았습니다" };
    }

    const { lot, spotNumber } = cancelSpot;
    const status = statusesByLot[lot][date]?.[spotNumber];

    if (status === "claimed_external" || status === "claimed_waiting") {
      // 파랑/보라: 신청자 비밀번호로 확인 -> 신청만 취소, 등록은 남아서 초록(빈자리)으로 돌아감
      const claim = claimByLot[lot][date]?.[spotNumber];
      if (!claim) {
        return { success: false, error: "신청 정보를 찾을 수 없습니다" };
      }
      if (pin !== claim.pin) {
        return { success: false, error: "비밀번호가 일치하지 않습니다" };
      }
      setSpotStatus(lot, date, spotNumber, "vacant");
      clearClaim(lot, date, spotNumber);
      setToast(`${spotNumber}번 (${date}) 신청이 취소되어 다시 빈자리가 됐어요.`);
      setCancelSpot(null);
      return { success: true };
    }

    if (status === "vacant") {
      // 초록: 등록자 비밀번호로 확인 -> 등록 자체를 취소, 회색(미등록)으로 완전히 되돌림
      const vacancy = vacancyByLot[lot][date]?.[spotNumber];
      if (!vacancy) {
        return { success: false, error: "등록 정보를 찾을 수 없습니다" };
      }
      if (pin !== vacancy.pin) {
        return { success: false, error: "비밀번호가 일치하지 않습니다" };
      }
      clearVacancy(lot, date, spotNumber);
      setToast(`${spotNumber}번 (${date}) 빈자리 등록이 취소됐어요.`);
      setCancelSpot(null);
      return { success: true };
    }

    return { success: false, error: "취소할 수 있는 자리가 아닙니다" };
  }

  function handleSpotClick(lot: LotId, spotNumber: number) {
    if (cancelMode) {
      setCancelSpot({ lot, spotNumber });
      return;
    }

    const status = statusesByLot[lot][date]?.[spotNumber];

    // 파랑(외부배정자 신청됨) 자리는 마감(전날 16:00) 지나면 클릭은 되지만
    // 신청 모달 대신 안내 토스트만 뜨고 실제 신청은 진행되지 않음
    if (status === "claimed_external" && !isWaitingOverrideAllowed(date)) {
      setToast("대기자 우선예약은 전날 16:00까지만 가능합니다");
      return;
    }

    setSelectedSpot({ lot, spotNumber });
  }

  return (
    <main className="min-h-screen p-8 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-4 mb-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="GE HealthCare" className="h-12 w-auto" />
        <h1 className="text-4xl font-bold">사내 주차장 공유 시스템</h1>
      </div>

      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap bg-gray-50 border border-gray-200 rounded-xl px-5 py-4">
        <div className="flex items-center gap-3">
          <label htmlFor="date" className="text-sm font-medium text-gray-700">
            날짜 선택
          </label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 font-mono-numeric"
          />
          {cancelMode && (
            <span className="text-sm text-[#6022A7] font-medium">
              취소 모드 — 취소할 자리(초록/파랑/보라)를 클릭하세요
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <VacancyRegisterButton
            defaultDate={date}
            isSpotRegistered={isSpotRegistered}
            onRegister={handleRegister}
          />
          <button
            type="button"
            onClick={() => setCancelMode((prev) => !prev)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
              cancelMode
                ? "bg-[#6022A7] border-[#6022A7] text-white hover:bg-[#4f1c89]"
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
            }`}
          >
            {cancelMode ? "취소 모드 끄기" : "등록/신청 취소"}
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-baseline justify-between">
            <h2 className="text-base font-semibold text-gray-900">
              지하 1층 신관 주차장
            </h2>
            <span className="text-xs text-gray-400 font-mono-numeric">{date}</span>
          </div>
          <div className="p-5">
            <FloorPlan
              date={date}
              spotStatuses={statusesFor("basement")}
              spotNames={namesFor("basement")}
              cancelMode={cancelMode}
              overrideAllowed={isWaitingOverrideAllowed(date)}
              onSpotClick={(spotNumber) => handleSpotClick("basement", spotNumber)}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-baseline justify-between">
            <h2 className="text-base font-semibold text-gray-900">
              로비 주차장
            </h2>
            <span className="text-xs text-gray-400 font-mono-numeric">{date}</span>
          </div>
          <div className="p-5">
            <LobbyFloorPlan
              date={date}
              spotStatuses={statusesFor("lobby")}
              spotNames={namesFor("lobby")}
              cancelMode={cancelMode}
              overrideAllowed={isWaitingOverrideAllowed(date)}
              onSpotClick={(spotNumber) => handleSpotClick("lobby", spotNumber)}
            />
          </div>
        </div>
      </div>

      {selectedSpot !== null && (
        <SpotClaimModal
          date={date}
          spotNumber={selectedSpot.spotNumber}
          waitingOnly={
            statusesFor(selectedSpot.lot)[selectedSpot.spotNumber] ===
            "claimed_external"
          }
          onClose={() => setSelectedSpot(null)}
          onClaim={handleClaim}
        />
      )}

      {cancelSpot !== null && (
        <CancelModal
          date={date}
          spotNumber={cancelSpot.spotNumber}
          onClose={() => setCancelSpot(null)}
          onCancel={handleCancel}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-3 rounded-lg shadow-lg z-50">
          {toast}
        </div>
      )}
    </main>
  );
}
