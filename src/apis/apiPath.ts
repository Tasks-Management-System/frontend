export const apiPath = {
    auth: {
        signup: "/auth/register",
        login: "/auth/login",
        getUsers: "/auth",
        getUserById: "/auth/",
        updateUser: "/auth/",
        deleteUser: "/auth/",
        logout: "/auth/logout",
        refreshToken: "/auth/refresh-token",
    },
    projects: {
        getProjects: "/projects",
        createProject: "/projects",
        updateProject: "/projects/:id",
        deleteProject: "/projects/:id",
        getProjectById: "/projects/:id",
    },
    tasks: {
        getTasks: "/tasks",
        getTaskById: "/tasks/:id",
        createTask: "/tasks",
        updateTask: "/tasks/:id",
        deleteTask: "/tasks/:id",
        taskQuery: "/tasks/query/",
        tasksReply: "/tasks/reply/",
    },
    attendance: {
        punchIn: "/attendance/punch-in",
        startBreak: "/attendance/start-break",
        endBreak: "/attendance/end-break",
        getAttendance: "/attendance",
        punchOut: "/attendance/punch-out",
    },
    leaves: {
        getLeaves: "/leaves",
        applyLeave:"/leaves/apply",
        updateLeaveStatus: "/leaves/",
        getLeaveById: "/leaves/",
    },
    hiring: {
        createHiring: "/hiring/create",
        getHiring: "/hiring",
        getHiringById: "/hiring/",
        deleteHiring: "/hiring/",
        updateHiring: "/hiring/update/",
    }
 
}

/**
 * Configure this in `.env` as `VITE_API_BASE_URL`.
 * Example: `VITE_API_BASE_URL=http://localhost:5000/api`
 */
export const API_BASE_URL: string =
    (import.meta as any)?.env?.VITE_API_BASE_URL?.toString?.() ||
    "http://localhost:5051/api/v1";

type PathParams = Record<string, string | number | boolean | null | undefined>;

/**
 * Builds a URL path by replacing `:param` segments and optionally appending
 * query params. Does not prepend `API_BASE_URL`.
 */
export function buildPath(
    pathTemplate: string,
    params?: PathParams,
    query?: PathParams
): string {
    let path = pathTemplate;

    if (params) {
        for (const [key, value] of Object.entries(params)) {
            const encoded = encodeURIComponent(String(value ?? ""));
            path = path.replace(new RegExp(`:${key}\\b`, "g"), encoded);
        }
    }

    if (query) {
        const usp = new URLSearchParams();
        for (const [key, value] of Object.entries(query)) {
            if (value === undefined || value === null) continue;
            usp.set(key, String(value));
        }
        const qs = usp.toString();
        if (qs) path += (path.includes("?") ? "&" : "?") + qs;
    }

    return path;
}