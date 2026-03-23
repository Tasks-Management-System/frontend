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

export const signup = () => {
    return useMutation({
        mutationKey: ["signup"],
        mutationFn: async ({ name, email, password }: { name: string, email: string, password: string }) => {
            const res = await api.post(apiPath.auth.signup, { name, email, password}, { auth: false })
            return res as AuthMutationResponse
        }
            
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
            const res = await api.put<{ user: User }>(
                apiPath.auth.updateUser + id,
                data,
                { auth: true }
            )
            return res.user
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["user", variables.id] })
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
