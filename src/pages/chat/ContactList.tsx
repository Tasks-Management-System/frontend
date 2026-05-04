import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { ChatGroup, ChatMessage } from "../../types/chat.types";
import type { User } from "../../types/user.types";
import { Avatar } from "./Avatar";
import { formatMessageTime } from "./chatUtils";

type ContactListProps = {
  users: User[];
  groups: ChatGroup[];
  onlineUserIds: Set<string>;
  selectedUserId: string;
  selectedGroupId: string;
  onSelectUser: (id: string) => void;
  onSelectGroup: (id: string) => void;
  currentUserId: string;
  lastMessages: Map<string, ChatMessage>;
  lastGroupMessages: Map<string, ChatMessage>;
  unreadCounts: Map<string, number>;
};

export function ContactList({
  users,
  groups,
  onlineUserIds,
  selectedUserId,
  selectedGroupId,
  onSelectUser,
  onSelectGroup,
  currentUserId,
  lastMessages,
  lastGroupMessages,
  unreadCounts,
}: ContactListProps) {
  const [search, setSearch] = useState("");

  const filteredUsers = useMemo(() => {
    const others = users.filter((u) => u._id !== currentUserId && u.isActive);
    if (!search.trim()) return others;
    const q = search.toLowerCase();
    return others.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [users, currentUserId, search]);

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      const aOnline = onlineUserIds.has(a._id) ? 1 : 0;
      const bOnline = onlineUserIds.has(b._id) ? 1 : 0;
      if (aOnline !== bOnline) return bOnline - aOnline;
      const aMsg = lastMessages.get(a._id);
      const bMsg = lastMessages.get(b._id);
      if (aMsg && bMsg)
        return new Date(bMsg.createdAt).getTime() - new Date(aMsg.createdAt).getTime();
      if (aMsg) return -1;
      if (bMsg) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [filteredUsers, onlineUserIds, lastMessages]);

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groups;
    const q = search.toLowerCase();
    return groups.filter((g) => g.name.toLowerCase().includes(q));
  }, [groups, search]);

  const hasResults = sortedUsers.length > 0 || filteredGroups.length > 0;

  return (
    <div className="flex h-full flex-col">
      <div className="p-3 sm:p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-500/20"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!hasResults ? (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <Search className="mb-2 h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-400">No conversations found</p>
          </div>
        ) : (
          <>
            {/* Groups section */}
            {filteredGroups.length > 0 && (
              <>
                <p className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Groups
                </p>
                {filteredGroups.map((group) => {
                  const isSelected = selectedGroupId === group._id;
                  const lastMsg = lastGroupMessages.get(group._id);
                  const unread = unreadCounts.get(`group:${group._id}`) ?? 0;

                  return (
                    <button
                      key={group._id}
                      type="button"
                      onClick={() => onSelectGroup(group._id)}
                      className={`flex w-full items-center gap-3 px-3 py-3 text-left transition-all duration-150 sm:px-4 ${
                        isSelected
                          ? "border-l-[3px] border-violet-600 bg-violet-50"
                          : "border-l-[3px] border-transparent hover:bg-gray-50"
                      }`}
                    >
                      <Avatar name={group.name} image={group.groupImage} size="md" shape="rounded" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={`truncate text-sm ${
                              unread > 0 ? "font-bold text-gray-900" : "font-medium text-gray-800"
                            }`}
                          >
                            {group.name}
                          </p>
                          {lastMsg && (
                            <span className="shrink-0 text-[11px] text-gray-400">
                              {formatMessageTime(lastMsg.createdAt)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-xs text-gray-500">
                            {lastMsg
                              ? lastMsg.sender._id === currentUserId
                                ? `You: ${lastMsg.message || "📎 Attachment"}`
                                : `${lastMsg.sender.name}: ${lastMsg.message || "📎 Attachment"}`
                              : `${group.members.length} members`}
                          </p>
                          {unread > 0 && !isSelected && (
                            <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-violet-600 px-1.5 text-[10px] font-bold text-white">
                              {unread > 99 ? "99+" : unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </>
            )}

            {/* DMs section */}
            {sortedUsers.length > 0 && (
              <>
                <p className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Direct Messages
                </p>
                {sortedUsers.map((user) => {
                  const isOnline = onlineUserIds.has(user._id);
                  const isSelected = selectedUserId === user._id;
                  const lastMsg = lastMessages.get(user._id);
                  const unread = unreadCounts.get(user._id) ?? 0;

                  return (
                    <button
                      key={user._id}
                      type="button"
                      onClick={() => onSelectUser(user._id)}
                      className={`flex w-full items-center gap-3 px-3 py-3 text-left transition-all duration-150 sm:px-4 ${
                        isSelected
                          ? "border-l-[3px] border-violet-600 bg-violet-50"
                          : "border-l-[3px] border-transparent hover:bg-gray-50"
                      }`}
                    >
                      <Avatar name={user.name} image={user.profileImage} online={isOnline} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={`truncate text-sm ${
                              unread > 0 ? "font-bold text-gray-900" : "font-medium text-gray-800"
                            }`}
                          >
                            {user.name}
                          </p>
                          {lastMsg && (
                            <span className="shrink-0 text-[11px] text-gray-400">
                              {formatMessageTime(lastMsg.createdAt)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-xs text-gray-500">
                            {lastMsg
                              ? lastMsg.sender._id === currentUserId
                                ? `You: ${lastMsg.message}`
                                : lastMsg.message
                              : isOnline
                                ? "Online"
                                : (user.role?.[0] ?? "Offline")}
                          </p>
                          {unread > 0 && !isSelected && (
                            <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-violet-600 px-1.5 text-[10px] font-bold text-white">
                              {unread > 99 ? "99+" : unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
