/**
 * Client session hints only (user id / roles for routing and UI).
 * Authentication is HttpOnly cookies — never store or read tokens in JS.
 */

const USER_ID_KEY = "userId";
const USER_ROLES_KEY = "userRoles";

export const getUserId = (): string => {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(USER_ID_KEY) ?? "";
};

export const setUserId = (id: string): void => {
  localStorage.setItem(USER_ID_KEY, id);
};

export const getStoredRoles = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USER_ROLES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
};

export const setStoredRoles = (roles: string[] | undefined): void => {
  if (typeof window === "undefined") return;
  if (!roles?.length) {
    localStorage.removeItem(USER_ROLES_KEY);
    return;
  }
  localStorage.setItem(USER_ROLES_KEY, JSON.stringify(roles));
};

/** Clears locally stored user hints (cookies cleared by backend on logout). */
export const clearSession = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(USER_ROLES_KEY);
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("authToken");
};

export const hasSessionHint = (): boolean => getUserId().length > 0;
