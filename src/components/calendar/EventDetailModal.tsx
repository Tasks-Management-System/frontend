import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect } from "react";
import type { CalendarEvent } from "../../types/calendar.types";
import { EVENT_COLORS } from "../../types/calendar.types";

type Props = {
  open: boolean;
  event: CalendarEvent | null;
  onClose: () => void;
  onEdit: (e: CalendarEvent) => void;
  onDelete: (e: CalendarEvent) => void;
  canModify: boolean;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const EventDetailModal = ({
  open,
  event,
  onClose,
  onEdit,
  onDelete,
  canModify,
}: Props) => {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open || !event) return null;

  const timeRange = event.allDay
    ? "All day"
    : `${event.start.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })} – ${event.end.toLocaleString(undefined, { timeStyle: "short" })}`;

  const handleDelete = () => {
    if (
      window.confirm(
        `Delete “${event.title}”? This cannot be undone for calendar events.`
      )
    ) {
      onDelete(event);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/30"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative max-h-[min(90dvh,720px)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span
              className="mt-1 h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: event.color || EVENT_COLORS[event.type] }}
              aria-hidden
            />
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-gray-900">{event.title}</h2>
              <span className="mt-1 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium capitalize text-blue-700">
                {event.type}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 px-6 py-4 text-sm text-gray-700">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              When
            </div>
            <p className="mt-1">{timeRange}</p>
          </div>
          {event.location && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Location
              </div>
              <p className="mt-1">{event.location}</p>
            </div>
          )}
          {event.description && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Description
              </div>
              <p className="mt-1 whitespace-pre-wrap">{event.description}</p>
            </div>
          )}
          {event.attendees && event.attendees.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Attendees
              </div>
              <ul className="mt-2 flex flex-col gap-2">
                {event.attendees.map((a, i) => (
                  <li key={(a.userId || a.email || "") + i} className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700">
                      {initials(a.name || a.email || "?")}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate font-medium text-gray-900">
                        {a.name || "Guest"}
                      </div>
                      {a.email && (
                        <div className="truncate text-xs text-gray-500">{a.email}</div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {event.source === "calendar" && canModify && (
            <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => onEdit(event)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default EventDetailModal;
