import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUserById } from "../../apis/api/auth";
import { getStoredUserRoles, routeAllowedRoles, userHasAnyRole } from "../../utils/moduleAccess";
import { getUserId } from "../../utils/session";
import { useActiveOrg } from "../../contexts/ActiveOrgContext";

type RoleRouteGuardProps = {
  children: ReactNode;
};

/**
 * Enforces `ROUTE_ROLE_ACCESS` for the current path.
 * Also respects the active org mode — when the user has switched to their
 * joined-org (member) context, or has no org at all, admin-only routes are
 * blocked even if their DB role is "admin".
 */
const RoleRouteGuard = ({ children }: RoleRouteGuardProps) => {
  const { pathname } = useLocation();
  const allowed = routeAllowedRoles(pathname);
  const userId = getUserId();
  const { data: user, isLoading, isError } = useUserById(userId);
  const { activeMode, hasBoth, noOrg, ownedOrg } = useActiveOrg();

  if (!userId || isError) {
    return <Navigate to="/login" replace />;
  }

  if (!allowed || allowed.length === 0) {
    return <>{children}</>;
  }

  const fromStore = getStoredUserRoles();
  const fromApi = user?.role ?? [];
  const dbRoles = fromApi.length ? fromApi : fromStore;

  // Derive effective roles from org context:
  // • No org at all → employee (nothing to manage)
  // • Both orgs, member mode → employee (viewing joined org)
  // • Viewing owned org → always admin (they created it; DB role may have been corrupted by a bug)
  // • Otherwise → use actual DB roles
  const isEmployeeContext = noOrg || (hasBoth && activeMode === "member");
  const isOwnedOrgContext = !!ownedOrg && activeMode === "owned";
  const effectiveRoles: string[] = isEmployeeContext
    ? ["employee"]
    : isOwnedOrgContext
      ? ["admin"]
      : dbRoles;

  if (isLoading && !fromStore.length) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">
        Loading…
      </div>
    );
  }

  if (!userHasAnyRole(effectiveRoles, allowed)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default RoleRouteGuard;
