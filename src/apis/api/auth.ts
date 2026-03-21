import { useMutation } from "@tanstack/react-query"
import { api } from "../apiService"
import { apiPath } from "../apiPath"
import type { LoginResponse } from "../../types/user.types"

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
            return res as LoginResponse
        }
            
    })
}
