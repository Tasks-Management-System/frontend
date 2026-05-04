import { MessageSquare, Plus } from "lucide-react";
import type { ChatGroup, ChatMessage } from "../../types/chat.types";
import type { User } from "../../types/user.types";
import { ContactList } from "./ContactList";

type ContactsPanelProps = {
  mobileShowChat: boolean;
  users: User[];
  groups: ChatGroup[];
  onlineUserIds: Set<string>;
  selectedUserId: string;
  selectedGroupId: string;
  currentUserId: string;
  lastMessages: Map<string, ChatMessage>;
  lastGroupMessages: Map<string, ChatMessage>;
  unreadCounts: Map<string, number>;
  onSelectUser: (id: string) => void;
  onSelectGroup: (id: string) => void;
  onNewGroup: () => void;
};

export function ContactsPanel({
  mobileShowChat,
  users,
  groups,
  onlineUserIds,
  selectedUserId,
  selectedGroupId,
  currentUserId,
  lastMessages,
  lastGroupMessages,
  unreadCounts,
  onSelectUser,
  onSelectGroup,
  onNewGroup,
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            title="New group"
            onClick={onNewGroup}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600 transition hover:bg-violet-100"
          >
            <Plus className="h-5 w-5" />
          </button>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <MessageSquare className="h-5 w-5" />
          </div>
        </div>
      </div>

      <ContactList
        users={users}
        groups={groups}
        onlineUserIds={onlineUserIds}
        selectedUserId={selectedUserId}
        selectedGroupId={selectedGroupId}
        onSelectUser={onSelectUser}
        onSelectGroup={onSelectGroup}
        currentUserId={currentUserId}
        lastMessages={lastMessages}
        lastGroupMessages={lastGroupMessages}
        unreadCounts={unreadCounts}
      />
    </div>
  );
}
