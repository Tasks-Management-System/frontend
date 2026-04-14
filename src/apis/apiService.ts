import { API_BASE_URL } from "./apiPath";
import { clearAuth, getToken } from "../utils/auth";

export const ACCOUNT_INACTIVE_CODE = "ACCOUNT_INACTIVE";

function handleInactiveAccountIfNeeded(
    status: number,
    data: unknown,
    auth: boolean
) {
    if (!auth || status !== 403) return;
    const code = (data as { code?: string })?.code;
    if (code !== ACCOUNT_INACTIVE_CODE) return;
    clearAuth();
    const msg = encodeURIComponent(
        (data as { message?: string })?.message ||
            "Your account has been deactivated."
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
    /** When true, includes `Authorization: Bearer <token>` if a token exists. */
    auth?: boolean;
    /** Override token (otherwise read from `localStorage`). */
    token?: string | null;
    /** Optional query params to append to the URL. */
    query?: QueryParams;
    /** Optional JSON body. */
    body?: unknown;
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

function getStoredToken() {
    return getToken();
}

async function parseMaybeJson(res: Response) {
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) return await res.json();
    const text = await res.text();
    return text.length ? text : null;
}

export async function request<T = unknown>(
    method: HttpMethod,
    path: string,
    options: RequestOptions = {}
): Promise<T> {
    const {
        auth = true,
        token = null,
        query,
        headers,
        body,
        ...init
    } = options;

    const finalToken = token ?? (auth ? getStoredToken() : null);

    const url = appendQuery(joinUrl(API_BASE_URL, path), query);
    const finalHeaders: HeadersInit = {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(finalToken ? { Authorization: `Bearer ${finalToken}` } : {}),
        ...(headers || {}),
    };

    const res = await fetch(url, {
        ...init,
        method,
        headers: finalHeaders,
        cache: "no-store",
        body: body === undefined ? undefined : JSON.stringify(body),
    });

    const data = await parseMaybeJson(res);

    if (!res.ok) {
        handleInactiveAccountIfNeeded(res.status, data, auth);
        const message =
            (data as any)?.message ||
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
    const { auth = true, token = null, query, headers, ...init } = options;
    const finalToken = token ?? (auth ? getStoredToken() : null);
    const url = appendQuery(joinUrl(API_BASE_URL, path), query);

    const finalHeaders: HeadersInit = {
        ...(finalToken ? { Authorization: `Bearer ${finalToken}` } : {}),
        ...(headers || {}),
    };

    const res = await fetch(url, {
        ...init,
        method,
        headers: finalHeaders,
        cache: "no-store",
        body: formData,
    });

    const data = await parseMaybeJson(res);

    if (!res.ok) {
        handleInactiveAccountIfNeeded(res.status, data, auth);
        const message =
            (data as any)?.message ||
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
    post: <T = unknown>(
        path: string,
        body?: unknown,
        options?: Omit<RequestOptions, "body">
    ) => request<T>("POST", path, { ...(options || {}), body }),
    put: <T = unknown>(
        path: string,
        body?: unknown,
        options?: Omit<RequestOptions, "body">
    ) => request<T>("PUT", path, { ...(options || {}), body }),
    patch: <T = unknown>(
        path: string,
        body?: unknown,
        options?: Omit<RequestOptions, "body">
    ) => request<T>("PATCH", path, { ...(options || {}), body }),
    del: <T = unknown>(path: string, options?: Omit<RequestOptions, "body">) =>
        request<T>("DELETE", path, options),
    upload: <T = unknown>(
        method: HttpMethod,
        path: string,
        formData: FormData,
        options?: Omit<RequestOptions, "body">
    ) => uploadFormData<T>(method, path, formData, options),
};

