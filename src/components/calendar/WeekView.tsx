import type { CalendarEvent } from "../../types/calendar.types";
import { addDays, startOfWeekSunday, ymdKey } from "./calendarUtils";

type Props = {
  weekAnchor: Date;
  events: CalendarEvent[];
  onSlotClick: (d: Date, hour: number, minute: number) => void;
  onEventClick: (e: CalendarEvent) => void;
  onDayHeaderClick: (d: Date) => void;
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

function minutesOfDay(d: Date) {
  return d.getHours() * 60 + d.getMinutes();
}

function eventsForDay(day: Date, events: CalendarEvent[]) {
  const s = startOfDay(day);
  const e = endOfDay(day);
  return events.filter((ev) => ev.end >= s && ev.start <= e);
}

const WeekView = ({ weekAnchor, events, onSlotClick, onEventClick, onDayHeaderClick }: Props) => {
  const weekStart = startOfWeekSunday(weekAnchor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 24 }, (_, h) => h);

  const allDayByDay = days.map((d) => eventsForDay(d, events).filter((ev) => ev.allDay));
  const timedByDay = days.map((d) => eventsForDay(d, events).filter((ev) => !ev.allDay));

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
      <div className="sticky top-0 z-20 grid grid-cols-[48px_repeat(7,minmax(0,1fr))] border-b border-gray-100 bg-white">
        <div className="border-r border-gray-100" />
        {days.map((d) => (
          <button
            key={ymdKey(d)}
            type="button"
            onClick={() => onDayHeaderClick(new Date(d))}
            className="border-r border-gray-100 px-1 py-2 text-center text-xs font-semibold text-gray-700 last:border-r-0 hover:bg-gray-50"
          >
            <div>{d.toLocaleDateString(undefined, { weekday: "short" })}</div>
            <div className="text-[11px] font-normal text-gray-500">
              {d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </div>
          </button>
        ))}
      </div>

      <div className="sticky top-[52px] z-10 grid grid-cols-[48px_repeat(7,minmax(0,1fr))] border-b border-gray-100 bg-amber-50/40">
        <div className="border-r border-gray-100 p-1 text-[10px] text-gray-400">All day</div>
        {days.map((d, i) => (
          <div
            key={`ad-${ymdKey(d)}`}
            className="flex min-h-[28px] flex-wrap gap-0.5 border-r border-gray-100 p-1 last:border-r-0"
          >
            {allDayByDay[i].map((ev) => (
              <button
                key={ev.id}
                type="button"
                onClick={() => onEventClick(ev)}
                className="max-w-full truncate rounded-sm border-l-2 bg-white px-1 py-0.5 text-[10px] font-medium text-gray-800 shadow-sm"
                style={{ borderLeftColor: ev.color }}
              >
                {ev.title}
              </button>
            ))}
          </div>
        ))}
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
        <div className="grid min-h-0 flex-1 grid-cols-7">
          {days.map((d, di) => (
            <div
              key={ymdKey(d)}
              className="relative border-r border-gray-100 last:border-r-0"
              style={{ height: DAY_HEIGHT }}
            >
              {hours.map((h) => (
                <button
                  key={h}
                  type="button"
                  aria-label={`${ymdKey(d)} ${h}:00`}
                  className="absolute left-0 right-0 border-b border-gray-100 hover:bg-blue-50/30"
                  style={{ top: (h / 24) * 100 + "%", height: 100 / 24 + "%" }}
                  onClick={() => onSlotClick(new Date(d), h, 0)}
                />
              ))}
              {timedByDay[di].map((ev) => {
                const dayStart = startOfDay(d);
                const dayEnd = endOfDay(d);
                const startClamped = ev.start < dayStart ? dayStart : ev.start;
                const endClamped = ev.end > dayEnd ? dayEnd : ev.end;
                const startM = minutesOfDay(startClamped);
                const endM = minutesOfDay(endClamped);
                const dur = Math.max(endM - startM, 15);
                const top = (startM / 1440) * 100;
                const height = (dur / 1440) * 100;
                return (
                  <button
                    key={ev.id + di}
                    type="button"
                    onClick={() => onEventClick(ev)}
                    className="absolute left-0.5 right-0.5 z-[1] overflow-hidden rounded-sm border-l-2 bg-white px-1 py-0.5 text-left text-[10px] font-medium text-gray-800 shadow-md"
                    style={{
                      borderLeftColor: ev.color,
                      top: `${top}%`,
                      height: `${height}%`,
                      minHeight: 20,
                    }}
                  >
                    <span className="line-clamp-2">{ev.title}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeekView;
