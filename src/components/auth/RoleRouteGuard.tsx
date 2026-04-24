import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getUserById } from "../../apis/api/auth";
import { getStoredUserRoles, routeAllowedRoles, userHasAnyRole } from "../../utils/moduleAccess";
import { getToken, getUserId } from "../../utils/auth";

type RoleRouteGuardProps = {
  children: ReactNode;
};

/**
 * Enforces `ROUTE_ROLE_ACCESS` for the current path. Falls back to stored roles
 * from login, then merges with fetched profile when available.
 */
const RoleRouteGuard = ({ children }: RoleRouteGuardProps) => {
  const { pathname } = useLocation();
  const allowed = routeAllowedRoles(pathname);
  const userId = getUserId();
  const { data: user, isLoading, isError } = getUserById(userId);

  if (!getToken() || !userId || isError) {
    return <Navigate to="/login" replace />;
  }

  if (!allowed || allowed.length === 0) {
    return <>{children}</>;
  }

  const fromStore = getStoredUserRoles();
  const fromApi = user?.role ?? [];
  const effectiveRoles = fromApi.length ? fromApi : fromStore;

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
