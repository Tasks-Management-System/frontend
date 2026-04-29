import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useMyOrgContext, type Organization } from "../apis/api/organization";

export type OrgMode = "owned" | "member";

type ActiveOrgContextValue = {
  activeMode: OrgMode;
  setActiveMode: (mode: OrgMode) => void;
  ownedOrg: Organization | null;
  memberOrg: Organization | null;
  hasBoth: boolean;
  noOrg: boolean;
  isLoading: boolean;
};

const ActiveOrgContext = createContext<ActiveOrgContextValue>({
  activeMode: "owned",
  setActiveMode: () => undefined,
  ownedOrg: null,
  memberOrg: null,
  hasBoth: false,
  noOrg: false,
  isLoading: true,
});

const STORAGE_KEY = "activeOrgMode";

export function ActiveOrgProvider({ children }: { children: ReactNode }) {
  const { data: context, isLoading } = useMyOrgContext();

  const ownedOrg = context?.ownedOrg ?? null;
  const memberOrg = context?.memberOrg ?? null;
  const hasBoth = !!ownedOrg && !!memberOrg;
  const noOrg = !isLoading && !ownedOrg && !memberOrg;

  const [activeMode, setActiveModeState] = useState<OrgMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as OrgMode | null;
    return stored === "member" ? "member" : "owned";
  });

  // When org context loads, correct the active mode if needed
  useEffect(() => {
    if (isLoading) return;
    if (!ownedOrg && memberOrg) {
      setActiveModeState("member");
    } else if (ownedOrg && !memberOrg) {
      setActiveModeState("owned");
    }
  }, [isLoading, ownedOrg, memberOrg]);

  const setActiveMode = (mode: OrgMode) => {
    setActiveModeState(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  };

  return (
    <ActiveOrgContext.Provider
      value={{ activeMode, setActiveMode, ownedOrg, memberOrg, hasBoth, noOrg, isLoading }}
    >
      {children}
    </ActiveOrgContext.Provider>
  );
}

export function useActiveOrg() {
  return useContext(ActiveOrgContext);
}
