/**
 * Centralized auth token management.
 * Single source of truth for all localStorage auth operations.
 * Uses "token" as the canonical key name throughout the app.
 */

const TOKEN_KEY = "token";
const USER_ID_KEY = "userId";
const USER_ROLES_KEY = "userRoles";

export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const t = localStorage.getItem(TOKEN_KEY);
  return t && t.trim() ? t : null;
};

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getUserId = (): string => {
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

export const clearAuth = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(USER_ROLES_KEY);
  // Remove legacy keys that may still exist from older sessions
  localStorage.removeItem("accessToken");
  localStorage.removeItem("authToken");
};
