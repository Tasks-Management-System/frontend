import type { CalendarEvent } from "../../types/calendar.types";
import { ymdKey } from "./calendarUtils";

type Props = {
  day: Date;
  events: CalendarEvent[];
  onSlotClick: (d: Date, hour: number, minute: number) => void;
  onEventClick: (e: CalendarEvent) => void;
  onDayTitleClick: (d: Date) => void;
};

const SLOT_PX = 48;
const DAY_HEIGHT = 24 * SLOT_PX;

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function minutesOfDay(dt: Date) {
  return dt.getHours() * 60 + dt.getMinutes();
}

function eventsForDay(day: Date, events: CalendarEvent[]) {
  const s = startOfDay(day);
  const e = endOfDay(day);
  return events.filter((ev) => ev.end >= s && ev.start <= e);
}

const DayView = ({ day, events, onSlotClick, onEventClick, onDayTitleClick }: Props) => {
  const hours = Array.from({ length: 24 }, (_, h) => h);
  const list = eventsForDay(day, events);
  const allDay = list.filter((ev) => ev.allDay);
  const timed = list.filter((ev) => !ev.allDay);
  const d0 = startOfDay(day);
  const d1 = endOfDay(day);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
      <div className="border-b border-gray-100 px-4 py-3">
        <button
          type="button"
          onClick={() => onDayTitleClick(new Date(day))}
          className="text-left text-lg font-semibold text-gray-900 hover:text-blue-700"
        >
          {day.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </button>
        {allDay.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {allDay.map((ev) => (
              <button
                key={ev.id}
                type="button"
                onClick={() => onEventClick(ev)}
                className="rounded-sm border-l-2 bg-amber-50/80 px-2 py-1 text-xs font-medium text-gray-800"
                style={{ borderLeftColor: ev.color }}
              >
                {ev.title} (all day)
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex max-h-[min(70vh,720px)] overflow-y-auto">
        <div className="w-12 shrink-0 border-r border-gray-100">
          {hours.map((h) => (
            <div
              key={h}
              className="box-border border-b border-gray-100 text-right pr-1 text-[10px] leading-none text-gray-400"
              style={{ height: SLOT_PX, paddingTop: 2 }}
            >
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>
        <div className="relative min-w-0 flex-1" style={{ height: DAY_HEIGHT }}>
          {hours.map((h) => (
            <button
              key={h}
              type="button"
              className="absolute left-0 right-0 border-b border-gray-100 hover:bg-blue-50/30"
              style={{ top: (h / 24) * 100 + "%", height: 100 / 24 + "%" }}
              onClick={() => onSlotClick(new Date(day), h, 0)}
              aria-label={`${ymdKey(day)} ${h}:00`}
            />
          ))}
          {timed.map((ev) => {
            const startClamped = ev.start < d0 ? d0 : ev.start;
            const endClamped = ev.end > d1 ? d1 : ev.end;
            const startM = minutesOfDay(startClamped);
            const endM = minutesOfDay(endClamped);
            const dur = Math.max(endM - startM, 15);
            const top = (startM / 1440) * 100;
            const height = (dur / 1440) * 100;
            const timeLabel = `${startClamped.toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            })} – ${endClamped.toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            })}`;
            return (
              <button
                key={ev.id}
                type="button"
                onClick={() => onEventClick(ev)}
                className="absolute left-1 right-1 z-[1] overflow-hidden rounded-sm border-l-2 bg-white p-2 text-left shadow-md"
                style={{
                  borderLeftColor: ev.color,
                  top: `${top}%`,
                  height: `${height}%`,
                  minHeight: 48,
                }}
              >
                <div className="text-sm font-semibold text-gray-900">{ev.title}</div>
                <div className="text-xs text-gray-500">{timeLabel}</div>
                {ev.location && (
                  <div className="mt-1 truncate text-xs text-gray-600">{ev.location}</div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DayView;
