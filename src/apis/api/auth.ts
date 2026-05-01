import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../apiService";
import { apiPath } from "../apiPath";
import type { LoginResponse, User } from "../../types/user.types";
import { clearSession } from "../../utils/session";

export const useLogin = () => {
  return useMutation({
    mutationKey: ["login"],
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const res = await api.post(apiPath.auth.login, { email, password }, { auth: false });
      return res as LoginResponse;
    },
    // Keep this hook side-effect free; handle token storage + navigation in the caller.
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["logout"],
    mutationFn: async () => {
      const res = await api.post<{ success: boolean; message?: string }>(
        apiPath.auth.logout,
        {},
        { auth: true }
      );
      return res;
    },
    onSettled: () => {
      clearSession();
      queryClient.clear();
    },
  });
};

export const useSignup = () => {
  return useMutation({
    mutationKey: ["signup"],
    mutationFn: async ({
      name,
      email,
      password,
    }: {
      name: string;
      email: string;
      password: string;
    }) => {
      const res = await api.post(apiPath.auth.signup, { name, email, password }, { auth: false });
      return res as { success: boolean; message?: string; user?: User };
    },
  });
};

export type AdminCreateUserInput = {
  name: string;
  email: string;
  password: string;
  role: "admin" | "employee" | "hr" | "manager";
  profileImage?: string;
  address?: Array<{ address?: string; city?: string }>;
  phone?: string;
  gender?: "male" | "female";
  dob?: string;
  skills?: Array<{ skill?: string; yearsOfExperience?: number }>;
  education?: Array<{
    degree?: string;
    institution?: string;
    year?: number;
    specialization?: string;
  }>;
  experience?: Array<{ company?: string; position?: string; startDate?: string; endDate?: string }>;
  leaves?: Array<{ totalBalance?: number; paidLeave?: number; leaveTaken?: number }>;
  aadharCardNumber?: string;
  panCardNumber?: string;
  bankAccountNo?: string;
  bankName?: string;
  bankIFSC?: string;
  bankBranch?: string;
};

export const useCreateUserByAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["createUserByAdmin"],
    mutationFn: async (body: AdminCreateUserInput) => {
      const res = await api.post<{ success: boolean; message?: string; user: User }>(
        apiPath.auth.createUser,
        body,
        { auth: true }
      );
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useUserById = (id: string) => {
  return useQuery({
    queryKey: ["user", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await api.get<{ user: User }>(apiPath.auth.getUserById + id, { auth: true });
      return res.user;
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["updateUser"],
    mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
      const res = await api.put<{ success?: boolean; user: User }>(
        apiPath.auth.updateUser + id,
        data,
        { auth: true }
      );
      return res.user;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useUpdateProfileImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["updateProfileImage"],
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData();
      formData.append("profileImage", file);
      const res = await api.upload<{ user: User }>("PUT", apiPath.auth.updateUser + id, formData, {
        auth: true,
      });
      return res.user;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user", variables.id] });
    },
  });
};

export const useUsers = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await api.get<{ users: User[] }>(apiPath.auth.getUsers, { auth: true });
      return res.users;
    },
  });
};

export type TeamBirthdayUser = {
  _id: string;
  name: string;
  profileImage?: string | null;
  role?: string[] | string;
  dob?: string | null;
};

/** Available to every authenticated user. Returns lightweight user records (id, name, role, dob). */
export const useTeamBirthdays = () => {
  return useQuery<TeamBirthdayUser[]>({
    queryKey: ["users", "teamBirthdays"],
    queryFn: async (): Promise<TeamBirthdayUser[]> => {
      try {
        const res = await api.get<{ success: boolean; users: TeamBirthdayUser[] }>(
          apiPath.auth.teamBirthdays,
          { auth: true }
        );
        return res.users ?? [];
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });
};

/** Returns [] when the current user cannot list users (e.g. not admin/hr). */
export const useAssignableUsers = (orgContext?: string) => {
  return useQuery<User[]>({
    queryKey: ["users", "assignable", orgContext],
    queryFn: async (): Promise<User[]> => {
      try {
        const res = await api.get<{ users: User[] }>(apiPath.auth.getUsers, {
          auth: true,
          query: orgContext ? { orgContext } : undefined,
        });
        return res.users;
      } catch {
        return [];
      }
    },
  });
};
