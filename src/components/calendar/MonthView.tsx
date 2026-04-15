import { useState } from "react";
import type { CalendarEvent } from "../../types/calendar.types";
import { eventsOnCalendarDay, getMonthGrid, isSameDay, ymdKey } from "./calendarUtils";
import EventPill from "./EventPill";

type Props = {
  monthAnchor: Date;
  events: CalendarEvent[];
  selectedDate: Date;
  onDayClick: (d: Date) => void;
  onMoreClick: (d: Date) => void;
  onEventClick: (e: CalendarEvent) => void;
  onEventDrop?: (event: CalendarEvent, newDate: Date) => void;
};

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MonthView = ({
  monthAnchor,
  events,
  selectedDate,
  onDayClick,
  onMoreClick,
  onEventClick,
  onEventDrop,
}: Props) => {
  const today = new Date();
  const grid = getMonthGrid(monthAnchor);
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, event: CalendarEvent) => {
    e.dataTransfer.setData("text/plain", JSON.stringify({ id: event.id, source: event.source }));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, cell: Date) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverDay(ymdKey(cell));
  };

  const handleDragLeave = () => {
    setDragOverDay(null);
  };

  const handleDrop = (e: React.DragEvent, cell: Date) => {
    e.preventDefault();
    setDragOverDay(null);

    try {
      const data = JSON.parse(e.dataTransfer.getData("text/plain"));
      if (!data?.id || !onEventDrop) return;

      const event = events.find((ev) => ev.id === data.id);
      if (!event) return;

      // Only allow drag for calendar source events
      if (event.source !== "calendar") return;

      onEventDrop(event, cell);
    } catch {
      // ignore parse errors
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
      <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50 text-center text-xs font-semibold text-gray-500">
        {weekdays.map((w) => (
          <div key={w} className="border-r border-gray-100 py-2 last:border-r-0">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {grid.flatMap((week, wi) =>
          week.map((cell, di) => {
            const inMonth = cell.getMonth() === monthAnchor.getMonth();
            const dayEvents = eventsOnCalendarDay(cell, events);
            const visible = dayEvents.slice(0, 3);
            const more = dayEvents.length - visible.length;
            const isToday = isSameDay(cell, today);
            const isSelected = isSameDay(cell, selectedDate);
            const isDragTarget = dragOverDay === ymdKey(cell);
            return (
              <div
                key={`${wi}-${di}-${ymdKey(cell)}`}
                onClick={() => onDayClick(new Date(cell))}
                onDragOver={(e) => handleDragOver(e, cell)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, cell)}
                className={`min-h-[104px] cursor-pointer border-b border-r border-gray-100 p-1 text-left last:border-r-0 transition-colors ${
                  isDragTarget ? "bg-blue-50 ring-2 ring-inset ring-blue-300" : ""
                } ${inMonth && !isDragTarget ? "hover:bg-blue-50/40" : ""} ${!inMonth && !isDragTarget ? "bg-gray-50/50" : ""}`}
              >
                <div
                  className={`mb-1 flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium ${
                    isToday || isSelected
                      ? "bg-blue-600 text-white"
                      : inMonth
                        ? "text-gray-800"
                        : "text-gray-400"
                  }`}
                >
                  {cell.getDate()}
                </div>
                <div className="flex min-h-[48px] flex-col gap-0.5">
                  {visible.map((ev) => (
                    <div
                      key={ev.id + ymdKey(cell)}
                      draggable={ev.source === "calendar"}
                      onDragStart={(e) => handleDragStart(e, ev)}
                    >
                      <EventPill event={ev} onClick={onEventClick} />
                    </div>
                  ))}
                  {more > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoreClick(new Date(cell));
                      }}
                      className="text-left text-[11px] font-medium text-blue-600 hover:underline"
                    >
                      +{more} more
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MonthView;
