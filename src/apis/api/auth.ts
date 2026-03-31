import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "../apiService"
import { apiPath } from "../apiPath"
import type { LoginResponse, User } from "../../types/user.types"

type AuthMutationResponse = Omit<LoginResponse, "token"> & { token?: string }

export const login = () => {
    return useMutation({
        mutationKey: ["login"],
        mutationFn: async ({ email, password }: { email: string, password: string }) => {
            const res = await api.post(apiPath.auth.login, { email, password }, { auth: false })
            return res as LoginResponse
        },
        // Keep this hook side-effect free; handle token storage + navigation in the caller.
    })
}

export const useLogout = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationKey: ["logout"],
        mutationFn: async () => {
            const res = await api.post<{ success: boolean; message?: string }>(
                apiPath.auth.logout,
                {},
                { auth: true }
            )
            return res
        },
        onSettled: () => {
            queryClient.clear()
        },
    })
}

export const signup = () => {
    return useMutation({
        mutationKey: ["signup"],
        mutationFn: async ({ name, email, password }: { name: string, email: string, password: string }) => {
            const res = await api.post(apiPath.auth.signup, { name, email, password}, { auth: false })
            return res as AuthMutationResponse
        }
            
    })
}

export type AdminCreateUserInput = {
    name: string
    email: string
    password: string
    role: "admin" | "employee" | "hr" | "manager"
}

export const useCreateUserByAdmin = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationKey: ["createUserByAdmin"],
        mutationFn: async (body: AdminCreateUserInput) => {
            const res = await api.post<{ success: boolean; message?: string; user: User }>(
                apiPath.auth.createUser,
                body,
                { auth: true }
            )
            return res
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] })
        },
    })
}

export const getUserById = (id: string) => {
    return useQuery({
        queryKey: ["user", id],
        enabled: !!id,
        queryFn: async () => {
            const res = await api.get<{ user: User }>(apiPath.auth.getUserById + id, { auth: true })
            return res.user
        }
    })
}

export const useUpdateUser = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationKey: ["updateUser"],
        mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
            const res = await api.put<{ success?: boolean; user: User }>(
                apiPath.auth.updateUser + id,
                data,
                { auth: true }
            )
            return res.user
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["user", variables.id] })
            queryClient.invalidateQueries({ queryKey: ["users"] })
        },
    })
}

export const useUpdateProfileImage = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationKey: ["updateProfileImage"],
        mutationFn: async ({ id, file }: { id: string; file: File }) => {
            const formData = new FormData()
            formData.append("profileImage", file)
            const res = await api.upload<{ user: User }>(
                "PUT",
                apiPath.auth.updateUser + id,
                formData,
                { auth: true }
            )
            return res.user
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["user", variables.id] })
        },
    })
}

export const getUsers = () => {
    return useQuery({
        queryKey: ["users"],
        queryFn: async () => {
            const res = await api.get<{ users: User[] }>(apiPath.auth.getUsers, { auth: true })
            return res.users
        },
    })
}

/** Returns [] when the current user cannot list users (e.g. not admin/hr). */
export const useAssignableUsers = () => {
    return useQuery<User[]>({
        queryKey: ["users", "assignable"],
        queryFn: async (): Promise<User[]> => {
            try {
                const res = await api.get<{ users: User[] }>(apiPath.auth.getUsers, {
                    auth: true,
                })
                return res.users
            } catch {
                return []
            }
        },
    })
}
