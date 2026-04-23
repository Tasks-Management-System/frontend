import { useQuery } from "@tanstack/react-query";
import { api } from "../apiService";
import type {
  ChatMessagesResponse,
  OnlineUsersResponse,
} from "../../types/chat.types";
import type { User } from "../../types/user.types";

export const useChatMessages = (receiverId: string, page = 1) => {
  return useQuery({
    queryKey: ["chatMessages", receiverId, page],
    enabled: !!receiverId,
    queryFn: async () => {
      const res = await api.get<ChatMessagesResponse>(
        `/chat/${receiverId}`,
        { auth: true, query: { page, limit: 50 } }
      );
      return res;
    },
  });
};

export const useChatUsers = () => {
  return useQuery({
    queryKey: ["chatUsers"],
    queryFn: async () => {
      const res = await api.get<{ users: User[] }>("/chat/users", {
        auth: true,
      });
      return res.users;
    },
  });
};

export const useOnlineUsers = () => {
  return useQuery({
    queryKey: ["onlineUsers"],
    queryFn: async () => {
      const res = await api.get<OnlineUsersResponse>("/chat/online", {
        auth: true,
      });
      return res.data;
    },
    refetchInterval: 30000,
  });
};
