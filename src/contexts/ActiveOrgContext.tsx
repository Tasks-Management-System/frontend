import { createContext, useContext, useState, type ReactNode } from "react";
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

  const [userChosenMode, setUserChosenMode] = useState<OrgMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as OrgMode | null;
    return stored === "member" ? "member" : "owned";
  });

  // Derive the effective mode without an effect — avoids cascading renders.
  // If the user only belongs to one org, force the correct mode regardless of
  // what is stored in localStorage.
  const activeMode: OrgMode =
    !isLoading && !ownedOrg && memberOrg
      ? "member"
      : !isLoading && ownedOrg && !memberOrg
        ? "owned"
        : userChosenMode;

  const setActiveMode = (mode: OrgMode) => {
    setUserChosenMode(mode);
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

// eslint-disable-next-line react-refresh/only-export-components
export function useActiveOrg() {
  return useContext(ActiveOrgContext);
}
