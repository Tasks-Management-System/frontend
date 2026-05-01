import { API_BASE_URL, apiPath } from "./apiPath";
import { clearSession } from "../utils/session";
import { reconnectSocketWithLatestAuth } from "../utils/socket";
import type { User } from "../types/user.types";

export const ACCOUNT_INACTIVE_CODE = "ACCOUNT_INACTIVE";

function handleInactiveAccountIfNeeded(status: number, data: unknown, auth: boolean) {
  if (!auth || status !== 403) return;
  const code = (data as { code?: string })?.code;
  if (code !== ACCOUNT_INACTIVE_CODE) return;
  clearSession();
  const msg = encodeURIComponent(
    (data as { message?: string })?.message || "Your account has been deactivated."
  );
  window.location.replace(`/login?reason=account_inactive&message=${msg}`);
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiErrorShape = {
  message: string;
  status?: number;
  data?: unknown;
};

export class ApiError extends Error {
  status?: number;
  data?: unknown;

  constructor({ message, status, data }: ApiErrorShape) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

type QueryParams = Record<string, string | number | boolean | null | undefined>;

export type RequestOptions = Omit<RequestInit, "method" | "body"> & {
  /** When true, treat 401 as "needs session" and attempt cookie refresh (then retry once). */
  auth?: boolean;
  /** Optional query params to append to the URL. */
  query?: QueryParams;
  /** Optional JSON body. */
  body?: unknown;
  /** @internal */
  _retryAfterRefresh?: boolean;
};

function joinUrl(base: string, path: string) {
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

function appendQuery(url: string, query?: QueryParams) {
  if (!query) return url;
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    usp.set(key, String(value));
  }
  const qs = usp.toString();
  if (!qs) return url;
  return url + (url.includes("?") ? "&" : "?") + qs;
}

async function parseMaybeJson(res: Response) {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return await res.json();
  const text = await res.text();
  return text.length ? text : null;
}

let refreshInFlight: Promise<boolean> | null = null;

async function tryRefreshAccessToken(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const url = joinUrl(API_BASE_URL, apiPath.auth.refreshToken);
        const res = await fetch(url, {
          method: "POST",
          credentials: "include",
          cache: "no-store",
        });
        const data = await parseMaybeJson(res);

        handleInactiveAccountIfNeeded(res.status, data, true);

        if (!res.ok) return false;
        reconnectSocketWithLatestAuth();
        return true;
      } catch {
        return false;
      }
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

function redirectSessionExpired() {
  clearSession();
  const msg = encodeURIComponent("Your session has expired. Please sign in again.");
  window.location.replace(`/login?reason=session_expired&message=${msg}`);
}

/**
 * Restore user from HttpOnly cookies without redirecting (for login / layout bootstrap).
 * Performs one refresh attempt if /auth/me returns 401.
 */
export async function resumeSessionFromCookies(): Promise<User | null> {
  async function getMe(): Promise<User | null> {
    const url = joinUrl(API_BASE_URL, apiPath.auth.me);
    const res = await fetch(url, { credentials: "include", cache: "no-store" });
    const data = await parseMaybeJson(res);
    if (!res.ok) return null;
    const user = (data as { user?: User })?.user;
    return user?._id ? user : null;
  }

  let user = await getMe();
  if (user) return user;

  const refreshed = await tryRefreshAccessToken();
  if (!refreshed) return null;

  user = await getMe();
  return user;
}

export async function request<T = unknown>(
  method: HttpMethod,
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { auth = true, query, headers, body, _retryAfterRefresh = false, ...init } = options;

  const url = appendQuery(joinUrl(API_BASE_URL, path), query);
  const finalHeaders: HeadersInit = {
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(headers || {}),
  };

  const res = await fetch(url, {
    ...init,
    method,
    headers: finalHeaders,
    credentials: "include",
    cache: "no-store",
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const data = await parseMaybeJson(res);

  if (res.status === 401 && auth && !_retryAfterRefresh) {
    const refreshed = await tryRefreshAccessToken();
    if (refreshed) {
      return request<T>(method, path, { ...options, _retryAfterRefresh: true });
    }
    redirectSessionExpired();
    const message =
      String((data as Record<string, unknown>)?.message || "") || "Session expired. Please sign in again.";
    throw new ApiError({ message, status: 401, data });
  }

  if (!res.ok) {
    handleInactiveAccountIfNeeded(res.status, data, auth);
    const message =
      String((data as Record<string, unknown>)?.message || "") ||
      (typeof data === "string" && data) ||
      res.statusText ||
      "Request failed";
    throw new ApiError({ message, status: res.status, data });
  }

  return data as T;
}

export async function uploadFormData<T = unknown>(
  method: HttpMethod,
  path: string,
  formData: FormData,
  options: Omit<RequestOptions, "body"> = {}
): Promise<T> {
  const { auth = true, query, headers, _retryAfterRefresh = false, ...init } = options;
  const url = appendQuery(joinUrl(API_BASE_URL, path), query);

  const finalHeaders: HeadersInit = {
    ...(headers || {}),
  };

  const res = await fetch(url, {
    ...init,
    method,
    headers: finalHeaders,
    credentials: "include",
    cache: "no-store",
    body: formData,
  });

  const data = await parseMaybeJson(res);

  if (res.status === 401 && auth && !_retryAfterRefresh) {
    const refreshed = await tryRefreshAccessToken();
    if (refreshed) {
      return uploadFormData<T>(method, path, formData, { ...options, _retryAfterRefresh: true });
    }
    redirectSessionExpired();
    const message =
      String((data as Record<string, unknown>)?.message || "") || "Session expired. Please sign in again.";
    throw new ApiError({ message, status: 401, data });
  }

  if (!res.ok) {
    handleInactiveAccountIfNeeded(res.status, data, auth);
    const message =
      String((data as Record<string, unknown>)?.message || "") ||
      (typeof data === "string" && data) ||
      res.statusText ||
      "Request failed";
    throw new ApiError({ message, status: res.status, data });
  }

  return data as T;
}

export const api = {
  get: <T = unknown>(path: string, options?: Omit<RequestOptions, "body">) =>
    request<T>("GET", path, options),
  post: <T = unknown>(path: string, body?: unknown, options?: Omit<RequestOptions, "body">) =>
    request<T>("POST", path, { ...(options || {}), body }),
  put: <T = unknown>(path: string, body?: unknown, options?: Omit<RequestOptions, "body">) =>
    request<T>("PUT", path, { ...(options || {}), body }),
  patch: <T = unknown>(path: string, body?: unknown, options?: Omit<RequestOptions, "body">) =>
    request<T>("PATCH", path, { ...(options || {}), body }),
  del: <T = unknown>(path: string, options?: Omit<RequestOptions, "body">) =>
    request<T>("DELETE", path, options),
  upload: <T = unknown>(
    method: HttpMethod,
    path: string,
    formData: FormData,
    options?: Omit<RequestOptions, "body">
  ) => uploadFormData<T>(method, path, formData, options),
};
