export interface ChatUser {
  _id: string;
  name: string;
  profileImage: string | null;
}

export interface ReplyToMessage {
  _id: string;
  message: string;
  sender: { _id: string; name: string };
  attachments?: ChatAttachment[];
}

export interface ChatAttachment {
  url: string;
  name: string;
  mimeType: string;
  size: number;
}

export interface ChatMessage {
  _id: string;
  sender: ChatUser;
  receiver: ChatUser;
  message: string;
  isRead: boolean;
  isEdited?: boolean;
  attachments?: ChatAttachment[];
  replyTo?: ReplyToMessage | null;
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
