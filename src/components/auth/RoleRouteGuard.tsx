import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUserById } from "../../apis/api/auth";
import { getStoredUserRoles, routeAllowedRoles, userHasAnyRole } from "../../utils/moduleAccess";
import { getToken, getUserId } from "../../utils/auth";
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
  const { activeMode, hasBoth, noOrg } = useActiveOrg();

  if (!getToken() || !userId || isError) {
    return <Navigate to="/login" replace />;
  }

  if (!allowed || allowed.length === 0) {
    return <>{children}</>;
  }

  const fromStore = getStoredUserRoles();
  const fromApi = user?.role ?? [];
  const dbRoles = fromApi.length ? fromApi : fromStore;

  // Override to employee roles when:
  // • user has no org at all (fresh account, nothing set up)
  // • user has both orgs but has switched to their joined-org (member) context
  const isEmployeeContext = noOrg || (hasBoth && activeMode === "member");
  const effectiveRoles: string[] = isEmployeeContext ? ["employee"] : dbRoles;

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
