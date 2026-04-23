import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../apiService";
import { apiPath, buildPath } from "../apiPath";

export type OrgMember = {
  _id: string;
  name: string;
  email: string;
  profileImage?: string | null;
  role?: string[] | string;
};

export type Organization = {
  _id: string;
  name: string;
  createdBy: OrgMember;
  members: OrgMember[];
  createdAt: string;
  updatedAt: string;
};

export type OrgInvite = {
  _id: string;
  organization: { _id: string; name: string; createdAt: string };
  invitedBy: OrgMember;
  invitedUser: OrgMember;
  status: "pending" | "accepted" | "rejected";
  expiresAt: string;
  createdAt: string;
};

export const useCreateOrganization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["createOrganization"],
    mutationFn: async (name: string) => {
      const res = await api.post<{ success: boolean; organization: Organization }>(
        apiPath.organization.create,
        { name },
        { auth: true }
      );
      return res.organization;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", "my"] });
    },
  });
};

export const useMyOrganization = () => {
  return useQuery<Organization | null>({
    queryKey: ["organization", "my"],
    queryFn: async () => {
      try {
        const res = await api.get<{ success: boolean; organization: Organization }>(
          apiPath.organization.my,
          { auth: true }
        );
        return res.organization;
      } catch {
        return null;
      }
    },
  });
};

export const useSendInvite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["sendOrgInvite"],
    mutationFn: async (userId: string) => {
      const res = await api.post<{ success: boolean; message: string; invite: OrgInvite }>(
        apiPath.organization.sendInvite,
        { userId },
        { auth: true }
      );
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", "adminInvites"] });
    },
  });
};

export const useAdminInvites = () => {
  return useQuery<OrgInvite[]>({
    queryKey: ["organization", "adminInvites"],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; invites: OrgInvite[] }>(
        apiPath.organization.adminInvites,
        { auth: true }
      );
      return res.invites ?? [];
    },
  });
};

export const useMyInvites = () => {
  return useQuery<OrgInvite[]>({
    queryKey: ["organization", "myInvites"],
    queryFn: async () => {
      try {
        const res = await api.get<{ success: boolean; invites: OrgInvite[] }>(
          apiPath.organization.myInvites,
          { auth: true }
        );
        return res.invites ?? [];
      } catch {
        return [];
      }
    },
    refetchInterval: 30_000,
  });
};

export const useAcceptInvite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["acceptOrgInvite"],
    mutationFn: async (inviteId: string) => {
      const path = buildPath(apiPath.organization.acceptInvite, { id: inviteId });
      const res = await api.patch<{ success: boolean; message: string }>(path, {}, { auth: true });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization"] });
    },
  });
};

export const useRejectInvite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["rejectOrgInvite"],
    mutationFn: async (inviteId: string) => {
      const path = buildPath(apiPath.organization.rejectInvite, { id: inviteId });
      const res = await api.patch<{ success: boolean; message: string }>(path, {}, { auth: true });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", "myInvites"] });
    },
  });
};

export type OrgListItem = {
  _id: string;
  name: string;
  createdBy: { _id: string; name: string; email: string; profileImage?: string | null };
  memberCount: number;
  createdAt: string;
};

export type JoinRequest = {
  _id: string;
  organization: { _id: string; name: string; createdAt: string };
  requestedBy: OrgMember;
  status: "pending" | "accepted" | "rejected";
  message: string;
  createdAt: string;
};

export const useAllOrganizations = () => {
  return useQuery<OrgListItem[]>({
    queryKey: ["organization", "all"],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; organizations: OrgListItem[] }>(
        apiPath.organization.all,
        { auth: true }
      );
      return res.organizations ?? [];
    },
  });
};

export const useSendJoinRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["sendJoinRequest"],
    mutationFn: async ({ organizationId, message }: { organizationId: string; message?: string }) => {
      const res = await api.post<{ success: boolean; message: string; joinRequest: JoinRequest }>(
        apiPath.organization.sendJoinRequest,
        { organizationId, message },
        { auth: true }
      );
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", "myJoinRequests"] });
    },
  });
};

export const useJoinRequests = () => {
  return useQuery<JoinRequest[]>({
    queryKey: ["organization", "joinRequests"],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; joinRequests: JoinRequest[] }>(
        apiPath.organization.joinRequests,
        { auth: true }
      );
      return res.joinRequests ?? [];
    },
  });
};

export const useMyJoinRequests = () => {
  return useQuery<JoinRequest[]>({
    queryKey: ["organization", "myJoinRequests"],
    queryFn: async () => {
      try {
        const res = await api.get<{ success: boolean; joinRequests: JoinRequest[] }>(
          apiPath.organization.myJoinRequests,
          { auth: true }
        );
        return res.joinRequests ?? [];
      } catch {
        return [];
      }
    },
  });
};

export const useAcceptJoinRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["acceptJoinRequest"],
    mutationFn: async (id: string) => {
      const path = buildPath(apiPath.organization.acceptJoinRequest, { id });
      const res = await api.patch<{ success: boolean; message: string }>(path, {}, { auth: true });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization"] });
    },
  });
};

export const useRejectJoinRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["rejectJoinRequest"],
    mutationFn: async (id: string) => {
      const path = buildPath(apiPath.organization.rejectJoinRequest, { id });
      const res = await api.patch<{ success: boolean; message: string }>(path, {}, { auth: true });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", "joinRequests"] });
    },
  });
};

export const useRemoveMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["removeOrgMember"],
    mutationFn: async ({ orgId, userId }: { orgId: string; userId: string }) => {
      const path = buildPath(apiPath.organization.removeMember, { orgId, userId });
      const res = await api.del<{ success: boolean; message: string }>(path, { auth: true });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", "my"] });
    },
  });
};
