"use client";

import { useCallback, useEffect, useState } from "react";
import FloorPlan, { SpotStatus } from "@/components/FloorPlan";
import LobbyFloorPlan from "@/components/LobbyFloorPlan";
import VacancyRegisterButton from "@/components/VacancyRegisterButton";
import SpotClaimModal from "@/components/SpotClaimModal";
import CancelModal from "@/components/CancelModal";
import AdminModeButton from "@/components/AdminModeButton";
import AdminCancelConfirmModal from "@/components/AdminCancelConfirmModal";
import type { LotId } from "@/lib/mockRoster";
import { isWaitingOverrideAllowed } from "@/lib/deadline";

type SpotInfo = { status: SpotStatus; applicantName?: string };
type SpotMap = Record<number, SpotInfo>;

function todayString() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

// 로컬 타임존 변환(toISOString 등)을 거치면 하루씩 밀리는 문제가 있어서
// 날짜를 직접 파싱해서 UTC 기준 정수 연산으로만 하루 이동시킴
function shiftDate(dateStr: string, deltaDays: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const shifted = new Date(Date.UTC(y, m - 1, d) + deltaDays * 24 * 60 * 60 * 1000);
  const yyyy = shifted.getUTCFullYear();
  const mm = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(shifted.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function Home() {
  const [date, setDate] = useState(todayString());

  // 서버(DB)에서 불러온 현재 날짜 기준 자리 상태 캐시. 진짜 데이터는 DB에 있고,
  // 여기 있는 건 화면에 그리기 위한 스냅샷 - 액션 성공 후 매번 다시 불러옴.
  const [basementSpots, setBasementSpots] = useState<SpotMap>({});
  const [lobbySpots, setLobbySpots] = useState<SpotMap>({});
  const [isLoading, setIsLoading] = useState(true);

  const refreshSpots = useCallback(async () => {
    setIsLoading(true);
    try {
      const [basementRes, lobbyRes] = await Promise.all([
        fetch(`/api/spots?lot=basement&date=${date}`),
        fetch(`/api/spots?lot=lobby&date=${date}`),
      ]);
      const basementData = await basementRes.json();
      const lobbyData = await lobbyRes.json();
      setBasementSpots(basementData.spots ?? {});
      setLobbySpots(lobbyData.spots ?? {});
    } catch {
      setToast("서버에서 자리 정보를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [date]);

  useEffect(() => {
    refreshSpots();
  }, [refreshSpots]);

  function statusesFor(lot: LotId): Record<number, SpotStatus> {
    const map = lot === "basement" ? basementSpots : lobbySpots;
    return Object.fromEntries(
      Object.entries(map).map(([num, info]) => [num, info.status])
    );
  }

  function namesFor(lot: LotId): Record<number, string> {
    const map = lot === "basement" ? basementSpots : lobbySpots;
    return Object.fromEntries(
      Object.entries(map)
        .filter(([, info]) => info.applicantName)
        .map(([num, info]) => [num, info.applicantName as string])
    );
  }

  const [selectedSpot, setSelectedSpot] = useState<
    { lot: LotId; spotNumber: number } | null
  >(null);
  const [cancelMode, setCancelMode] = useState(false);
  const [cancelSpot, setCancelSpot] = useState<
    { lot: LotId; spotNumber: number } | null
  >(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminCancelSpot, setAdminCancelSpot] = useState<
    { lot: LotId; spotNumber: number } | null
  >(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  function handleSpotClick(lot: LotId, spotNumber: number) {
    if (isAdmin) {
      const status = statusesFor(lot)[spotNumber];
      if (status !== undefined) {
        setAdminCancelSpot({ lot, spotNumber });
      }
      return;
    }

    if (cancelMode) {
      setCancelSpot({ lot, spotNumber });
      return;
    }

    const status = statusesFor(lot)[spotNumber];

    // 파랑(외부배정자 신청됨) 자리는 마감(전날 16:00) 지나면 클릭은 되지만
    // 신청 모달 대신 안내 토스트만 뜨고 실제 신청은 진행되지 않음
    if (status === "claimed_external" && !isWaitingOverrideAllowed(date)) {
      setToast("대기자 우선예약은 전날 16:00까지만 가능합니다");
      return;
    }

    setSelectedSpot({ lot, spotNumber });
  }

  return (
    <main className="min-h-screen p-8 max-w-[1700px] mx-auto">
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
          <button
            type="button"
            onClick={() => setDate((d) => shiftDate(d, -1))}
            aria-label="전날로 이동"
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-100"
          >
            ‹
          </button>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 font-mono-numeric"
          />
          <button
            type="button"
            onClick={() => setDate((d) => shiftDate(d, 1))}
            aria-label="다음날로 이동"
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-100"
          >
            ›
          </button>
          {cancelMode && (
            <span className="text-sm text-[#6022A7] font-medium">
              취소 모드 — 취소할 자리(초록/파랑/보라)를 클릭하세요
            </span>
          )}
          {isAdmin && (
            <span className="text-sm text-gray-900 font-medium">
              관리자 모드 — 등록/신청된 자리를 클릭하면 바로 취소할 수 있어요
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isAdmin && (
            <>
              <VacancyRegisterButton
                defaultDate={date}
                onRegistered={() => {
                  refreshSpots();
                  setToast("자리가 등록됐어요!");
                }}
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
            </>
          )}
          <AdminModeButton
            isAdmin={isAdmin}
            onChange={(next, password) => {
              setIsAdmin(next);
              if (password) setAdminPassword(password);
            }}
          />
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
              cancelMode={cancelMode || isAdmin}
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
              cancelMode={cancelMode || isAdmin}
              overrideAllowed={isWaitingOverrideAllowed(date)}
              onSpotClick={(spotNumber) => handleSpotClick("lobby", spotNumber)}
            />
          </div>
        </div>
      </div>

      {/* 두 지도 공통 범례 - 하단 중앙에 작은 박스 하나만, 한 줄로 고정 */}
      <div className="mt-6" style={{ display: "flex", justifyContent: "center" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "nowrap",
            alignItems: "center",
            justifyContent: "center",
            gap: "2.5rem",
            whiteSpace: "nowrap",
            fontSize: "0.75rem",
            color: "#6b7280",
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "9999px",
            padding: "0.625rem 2rem",
            boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
          }}
        >
          <span style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "0.375rem", whiteSpace: "nowrap" }}>
            <span
              style={{
                width: "0.75rem",
                height: "0.75rem",
                borderRadius: "0.125rem",
                backgroundColor: "#8b5cf6",
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            대기자 신청
          </span>
          <span style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "0.375rem", whiteSpace: "nowrap" }}>
            <span
              style={{
                width: "0.75rem",
                height: "0.75rem",
                borderRadius: "0.125rem",
                backgroundColor: "#2563eb",
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            외부 배정자 신청
          </span>
          <span style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "0.375rem", whiteSpace: "nowrap" }}>
            <span
              style={{
                width: "0.75rem",
                height: "0.75rem",
                borderRadius: "0.125rem",
                backgroundColor: "#10b981",
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            빈자리
          </span>
        </div>
      </div>

      {selectedSpot !== null && (
        <SpotClaimModal
          date={date}
          lot={selectedSpot.lot}
          spotNumber={selectedSpot.spotNumber}
          waitingOnly={
            statusesFor(selectedSpot.lot)[selectedSpot.spotNumber] ===
            "claimed_external"
          }
          onClose={() => setSelectedSpot(null)}
          onClaimed={() => {
            refreshSpots();
            setToast(`${selectedSpot.spotNumber}번 자리가 예약됐어요!`);
            setSelectedSpot(null);
          }}
        />
      )}

      {cancelSpot !== null && (
        <CancelModal
          date={date}
          lot={cancelSpot.lot}
          spotNumber={cancelSpot.spotNumber}
          onClose={() => setCancelSpot(null)}
          onCancelled={() => {
            refreshSpots();
            setToast(`${cancelSpot.spotNumber}번 자리의 등록/신청이 취소됐어요.`);
            setCancelSpot(null);
          }}
        />
      )}

      {adminCancelSpot !== null && (
        <AdminCancelConfirmModal
          date={date}
          lot={adminCancelSpot.lot}
          spotNumber={adminCancelSpot.spotNumber}
          adminPassword={adminPassword}
          onClose={() => setAdminCancelSpot(null)}
          onCancelled={() => {
            refreshSpots();
            setToast(`[관리자] ${adminCancelSpot.spotNumber}번 자리가 취소됐어요.`);
            setAdminCancelSpot(null);
          }}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-3 rounded-lg shadow-lg z-50">
          {toast}
        </div>
      )}

      {isLoading && (
        <div className="fixed top-4 right-4 text-xs text-gray-400">
          불러오는 중...
        </div>
      )}
    </main>
  );
}
