"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  DEFAULT_ROSTER,
  LOBBY_ROSTER,
  Employee,
  findEmployeeInRoster,
} from "@/lib/mockRoster";

const STORAGE_KEY = "parking-share-roster-v1";

type RosterContextValue = {
  roster: Employee[];
  findEmployeeByName: (name: string) => Employee | undefined;
  replaceRoster: (newRoster: Employee[]) => void;
  isDefault: boolean; // 아직 엑셀 업로드 전, 기본 명단 그대로인지
};

const RosterContext = createContext<RosterContextValue | null>(null);

export function RosterProvider({ children }: { children: ReactNode }) {
  const [roster, setRoster] = useState<Employee[]>(DEFAULT_ROSTER);
  const [isDefault, setIsDefault] = useState(true);

  // 최초 로드 시 localStorage에 저장된 업로드 명단이 있으면 그걸로 복원
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Employee[];
        setRoster(parsed);
        setIsDefault(false);
      }
    } catch {
      // localStorage 파싱 실패 시 기본 명단 유지
    }
  }, []);

  function replaceRoster(newRoster: Employee[]) {
    // 엑셀에는 로비 정보가 없으니 항상 로비 명단을 이어붙임
    const merged = [...newRoster, ...LOBBY_ROSTER];
    setRoster(merged);
    setIsDefault(false);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch {
      // 저장 실패해도 현재 세션 동작에는 지장 없음
    }
  }

  return (
    <RosterContext.Provider
      value={{
        roster,
        findEmployeeByName: (name: string) =>
          findEmployeeInRoster(roster, name),
        replaceRoster,
        isDefault,
      }}
    >
      {children}
    </RosterContext.Provider>
  );
}

export function useRoster() {
  const ctx = useContext(RosterContext);
  if (!ctx) {
    throw new Error("useRoster는 RosterProvider 안에서만 사용해야 합니다");
  }
  return ctx;
}
