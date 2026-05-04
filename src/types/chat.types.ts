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

export interface ChatReaction {
  emoji: string;
  user: ChatUser;
}

export interface ChatMessage {
  _id: string;
  sender: ChatUser;
  receiver?: ChatUser | null;
  group?: { _id: string; name: string } | null;
  message: string;
  isRead: boolean;
  isEdited?: boolean;
  attachments?: ChatAttachment[];
  replyTo?: ReplyToMessage | null;
  reactions?: ChatReaction[];
  mentions?: ChatUser[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatGroup {
  _id: string;
  name: string;
  description?: string;
  createdBy: ChatUser;
  members: ChatUser[];
  admins: ChatUser[];
  groupImage: string | null;
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

export interface ChatGroupsResponse {
  success: boolean;
  data: ChatGroup[];
}
