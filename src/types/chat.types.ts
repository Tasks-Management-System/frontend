export interface ChatUser {
  _id: string;
  name: string;
  profileImage: string | null;
}

export interface ChatMessage {
  _id: string;
  sender: ChatUser;
  receiver: ChatUser;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ChatMessagesResponse {
  success: boolean;
  data: ChatMessage[];
  pagination: ChatPagination;
}

export interface OnlineUsersResponse {
  success: boolean;
  data: string[];
}
