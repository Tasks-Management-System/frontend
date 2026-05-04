import { MessageSquare } from "lucide-react";
import type { ChatMessage } from "../../types/chat.types";
import type { User } from "../../types/user.types";
import { ContactList } from "./ContactList";

type ContactsPanelProps = {
  mobileShowChat: boolean;
  users: User[];
  onlineUserIds: Set<string>;
  selectedUserId: string;
  currentUserId: string;
  lastMessages: Map<string, ChatMessage>;
  unreadCounts: Map<string, number>;
  onSelectUser: (id: string) => void;
};

export function ContactsPanel({
  mobileShowChat,
  users,
  onlineUserIds,
  selectedUserId,
  currentUserId,
  lastMessages,
  unreadCounts,
  onSelectUser,
}: ContactsPanelProps) {
  return (
    <div
      className={`${
        mobileShowChat ? "hidden" : "flex"
      } w-full flex-col border-r border-gray-200/60 md:flex md:w-80 lg:w-96`}
    >
      <div className="flex items-center justify-between border-b border-gray-200/60 px-4 py-4 sm:px-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Messages</h2>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
          <MessageSquare className="h-5 w-5" />
        </div>
      </div>

      <ContactList
        users={users}
        onlineUserIds={onlineUserIds}
        selectedId={selectedUserId}
        onSelect={onSelectUser}
        currentUserId={currentUserId}
        lastMessages={lastMessages}
        unreadCounts={unreadCounts}
      />
    </div>
  );
}
