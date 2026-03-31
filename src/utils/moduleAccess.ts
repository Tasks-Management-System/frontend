/**
 * Aligns with backend `user.model` role enum and authorize middleware.
 * Use for sidebar, menus, and route guards.
 */
export type AppRole = "super-admin" | "admin" | "employee" | "hr" | "manager";

const USER_ROLES_LS = "userRoles";

/** Persist roles on login so guards can run before /user/:id finishes loading. */
export function setStoredUserRoles(roles: string[] | undefined) {
  if (typeof window === "undefined") return;
  if (!roles?.length) {
    localStorage.removeItem(USER_ROLES_LS);
    return;
  }
  localStorage.setItem(USER_ROLES_LS, JSON.stringify(roles));
}

export function getStoredUserRoles(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USER_ROLES_LS);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function clearStoredUserRoles() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_ROLES_LS);
}

/** Clears auth storage (token, user id, cached roles). */
export function clearClientAuthSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("authToken");
  localStorage.removeItem("userId");
  clearStoredUserRoles();
}

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
