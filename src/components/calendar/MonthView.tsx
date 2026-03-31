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
};

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MonthView = ({
  monthAnchor,
  events,
  selectedDate,
  onDayClick,
  onMoreClick,
  onEventClick,
}: Props) => {
  const today = new Date();
  const grid = getMonthGrid(monthAnchor);

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
            return (
              <div
                key={`${wi}-${di}-${ymdKey(cell)}`}
                onClick={() => onDayClick(new Date(cell))}
                className={`min-h-[104px] cursor-pointer border-b border-r border-gray-100 p-1 text-left last:border-r-0 ${
                  inMonth ? "hover:bg-blue-50/40" : ""
                } ${!inMonth ? "bg-gray-50/50" : ""}`}
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
                    <EventPill key={ev.id + ymdKey(cell)} event={ev} onClick={onEventClick} />
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
