/**
 * Aligns with backend `user.model` role enum and authorize middleware.
 * Use for sidebar, menus, and route guards.
 */
export type AppRole = "super-admin" | "admin" | "employee" | "hr" | "manager";

export {
  getStoredRoles as getStoredUserRoles,
  setStoredRoles as setStoredUserRoles,
  clearAuth as clearStoredUserRoles,
  clearAuth as clearClientAuthSession,
  getToken as getClientAuthToken,
} from "./auth";

/**
 * If `allowed` is omitted or empty, any authenticated user passes.
 * User may have multiple roles in `role[]`; one match is enough.
 */
export function userHasAnyRole(
  userRoles: string[] | undefined,
  allowed?: readonly AppRole[]
): boolean {
  if (!allowed || allowed.length === 0) return true;
  const set = new Set(userRoles ?? []);
  return allowed.some((r) => set.has(r));
}

/** Routes that require specific roles (undefined = any logged-in user). */
export const ROUTE_ROLE_ACCESS: Partial<
  Record<string, readonly AppRole[] | undefined>
> = {
  "/salary": ["admin", "hr", "super-admin"],
  "/employee": ["admin", "hr", "super-admin"],
  "/settings": ["admin", "hr", "super-admin"],
};

export function routeAllowedRoles(pathname: string): readonly AppRole[] | undefined {
  return ROUTE_ROLE_ACCESS[pathname];
}
