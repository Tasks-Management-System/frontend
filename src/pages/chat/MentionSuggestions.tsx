import { useEffect, useRef } from "react";
import type { User } from "../../types/user.types";
import { Avatar } from "./Avatar";

type MentionSuggestionsProps = {
  query: string;
  users: User[];
  currentUserId: string;
  onSelect: (user: User) => void;
  onDismiss: () => void;
};

export function MentionSuggestions({
  query,
  users,
  currentUserId,
  onSelect,
  onDismiss,
}: MentionSuggestionsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = users
    .filter(
      (u) =>
        u._id !== currentUserId &&
        u.isActive &&
        (u.name ?? "").trim().length > 0 &&
        (u.name ?? "").toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 6);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onDismiss();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onDismiss]);

  if (filtered.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="absolute bottom-full left-0 z-50 mb-2 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl ring-1 ring-black/5"
    >
      <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        Mention a person
      </p>
      {filtered.map((user) => (
        <button
          key={user._id}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault(); // prevent textarea blur
            onSelect(user);
          }}
          className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition hover:bg-violet-50"
        >
          <Avatar name={user.name} image={user.profileImage} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-800">{user.name}</p>
            <p className="truncate text-xs text-gray-400">{user.role?.[0] ?? ""}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
