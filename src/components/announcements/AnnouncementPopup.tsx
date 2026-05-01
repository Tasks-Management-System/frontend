import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Megaphone, Pin, Check, ChevronRight } from "lucide-react";
import { useAnnouncements, useMarkAnnouncementRead } from "../../apis/api/announcements";
import { useUserById } from "../../apis/api/auth";
import { getUserId } from "../../utils/session";
import { useActiveOrg } from "../../contexts/ActiveOrgContext";
import type { Announcement } from "../../types/announcement.types";

const HIDDEN_FOR_ROLES = ["admin", "super-admin"];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Shows unread announcements in a smooth animated modal when a user
 * opens the app. Clicking "Got it" marks the announcement as read on
 * the server so it never appears again for that user.
 */
const AnnouncementPopup = () => {
  const userId = getUserId();
  const { data: user } = useUserById(userId);
  const roles: string[] = user?.role ?? [];
  const isManager = roles.some((r) => HIDDEN_FOR_ROLES.includes(r));
  const { activeMode } = useActiveOrg();

  const { data: announcements = [], isLoading } = useAnnouncements(activeMode);
  const markReadMutation = useMarkAnnouncementRead();

  // Snapshot the unread list once per session so newly-added items
  // during the current visit don't interrupt the user mid-flow.
  const [queue, setQueue] = useState<Announcement[] | null>(null);
  const [index, setIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [cardKey, setCardKey] = useState(0);
  const [cardVisible, setCardVisible] = useState(true);

  const EXIT_MS = 180;

  const unread = useMemo(
    () =>
      announcements
        .filter((a) => !a.isRead)
        .sort((a, b) => {
          if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }),
    [announcements]
  );

  useEffect(() => {
    if (isManager || isLoading || dismissed || queue !== null) return;
    if (unread.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQueue(unread);

      setIndex(0);
    }
  }, [isManager, isLoading, unread, dismissed, queue]);

  const current = queue && queue[index] ? queue[index] : null;
  const open = !!current;

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShouldRender(true);
      requestAnimationFrame(() => setIsVisible(true));
      return;
    }
    setIsVisible(false);
    const t = window.setTimeout(() => setShouldRender(false), EXIT_MS);
    return () => window.clearTimeout(t);
  }, [open]);

  const advance = async () => {
    if (!current) return;
    const currentId = current._id;
    try {
      await markReadMutation.mutateAsync(currentId);
    } catch {
      // If it fails we still advance so the user isn't stuck.
    }

    if (queue && index < queue.length - 1) {
      // animate card out, swap, animate in
      setCardVisible(false);
      window.setTimeout(() => {
        setIndex((i) => i + 1);
        setCardKey((k) => k + 1);
        setCardVisible(true);
      }, 160);
    } else {
      setDismissed(true);
      setQueue(null);
      setIndex(0);
    }
  };

  if (isManager) return null;
  if (!shouldRender || !current) return null;

  const total = queue?.length ?? 0;

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="announcement-popup-title"
    >
      <div
        className={`absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden
      />

      <div
        key={cardKey}
        className={`relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 transition-all ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isVisible && cardVisible
            ? "translate-y-0 scale-100 opacity-100 duration-300"
            : "translate-y-4 scale-[0.96] opacity-0 duration-200"
        }`}
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-violet-500 to-fuchsia-500 px-6 pb-14 pt-7 text-white">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

          <div className="relative flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
              <span className="absolute inset-0 animate-ping rounded-2xl bg-white/30 opacity-75" />
              <Megaphone className="relative h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-white/80">
                New announcement
              </p>
              <p className="truncate text-[13px] text-white/90">
                From {current.postedBy?.name ?? "Admin"} · {formatDate(current.createdAt)}
              </p>
            </div>
            {current.isPinned && (
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-medium backdrop-blur">
                <Pin className="h-3 w-3" />
                Pinned
              </span>
            )}
          </div>
        </div>

        <div className="mt-2 rounded-t-3xl bg-white px-6 pb-6 pt-2">
          <h2
            id="announcement-popup-title"
            className="text-lg font-semibold leading-snug text-slate-900"
          >
            {current.title}
          </h2>

          <p className="mt-3 max-h-[40vh] overflow-y-auto whitespace-pre-line text-sm leading-relaxed text-slate-600">
            {current.content}
          </p>

          <div className="mt-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              {total > 1 &&
                Array.from({ length: total }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === index
                        ? "w-6 bg-violet-600"
                        : i < index
                          ? "w-1.5 bg-violet-300"
                          : "w-1.5 bg-slate-200"
                    }`}
                  />
                ))}
              {total > 1 && (
                <span className="ml-2 text-xs text-slate-400">
                  {index + 1} / {total}
                </span>
              )}
            </div>

            <button
              type="button"
              disabled={markReadMutation.isPending}
              onClick={advance}
              className="group inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {index < total - 1 ? (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Got it
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AnnouncementPopup;
