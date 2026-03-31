import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect } from "react";
import type { CalendarEvent } from "../../types/calendar.types";
import { EVENT_COLORS } from "../../types/calendar.types";

type Props = {
  open: boolean;
  date: Date | null;
  events: CalendarEvent[];
  onClose: () => void;
  onAddEvent: () => void;
  onEventOpen: (e: CalendarEvent) => void;
};

const DayEventsModal = ({
  open,
  date,
  events,
  onClose,
  onAddEvent,
  onEventOpen,
}: Props) => {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open || !date) return null;

  const sorted = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());
  const title = date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="day-events-modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[min(85vh,640px)] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <h2 id="day-events-modal-title" className="text-lg font-semibold text-gray-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {sorted.length === 0 ? (
            <p className="px-5 py-6 text-sm text-gray-500">No events on this day.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {sorted.map((ev) => {
                const timeRange = ev.allDay
                  ? "All day"
                  : `${ev.start.toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })} – ${ev.end.toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`;
                return (
                  <li key={ev.id}>
                    <button
                      type="button"
                      onClick={() => onEventOpen(ev)}
                      className="flex w-full items-start gap-3 px-5 py-3 text-left hover:bg-gray-50"
                    >
                      <span
                        className="mt-1.5 h-8 w-1 shrink-0 rounded-full"
                        style={{ backgroundColor: ev.color || EVENT_COLORS[ev.type] }}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900">{ev.title}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          <span>{timeRange}</span>
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 font-medium capitalize text-blue-700">
                            {ev.type}
                          </span>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-gray-100 px-5 py-4">
          <button
            type="button"
            onClick={onAddEvent}
            className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Add event
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DayEventsModal;
