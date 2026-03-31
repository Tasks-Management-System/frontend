import type { CalendarEvent } from "../../types/calendar.types";
import { ymdKey } from "./calendarUtils";

type Props = {
  fromDay: Date;
  events: CalendarEvent[];
  onEventClick: (e: CalendarEvent) => void;
};

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

const AgendaView = ({ fromDay, events, onEventClick }: Props) => {
  const start = startOfDay(fromDay);
  const end = addDays(start, 30);
  const inHorizon = events.filter((ev) => ev.start < end && ev.end >= start);

  const byDay = new Map<string, CalendarEvent[]>();
  for (const ev of inHorizon) {
    let d = new Date(Math.max(ev.start.getTime(), start.getTime()));
    const last = new Date(Math.min(ev.end.getTime(), end.getTime()));
    while (d <= last) {
      const key = ymdKey(d);
      const arr = byDay.get(key) ?? [];
      if (!arr.some((x) => x.id === ev.id)) arr.push(ev);
      byDay.set(key, arr);
      d = addDays(d, 1);
    }
  }

  const dayKeys: string[] = [];
  for (let i = 0; i < 30; i++) {
    dayKeys.push(ymdKey(addDays(start, i)));
  }

  const hasAny = dayKeys.some((k) => (byDay.get(k)?.length ?? 0) > 0);

  if (!hasAny) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-500">
        No events in the next 30 days.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
      <div className="max-h-[min(75vh,800px)] overflow-y-auto">
        {dayKeys.map((key) => {
          const dayEvents = byDay.get(key) ?? [];
          if (dayEvents.length === 0) return null;
          const headerDate = new Date(key + "T12:00:00");
          return (
            <section key={key}>
              <div className="sticky top-0 z-10 border-b border-gray-100 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-800">
                {headerDate.toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
              <ul className="divide-y divide-gray-100">
                {dayEvents
                  .slice()
                  .sort((a, b) => a.start.getTime() - b.start.getTime())
                  .map((ev) => (
                    <li key={ev.id + key}>
                      <button
                        type="button"
                        onClick={() => onEventClick(ev)}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-gray-50"
                      >
                        <span
                          className="mt-1 h-10 w-1 shrink-0 rounded-full"
                          style={{ backgroundColor: ev.color }}
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900">{ev.title}</div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                            {ev.allDay ? (
                              <span>All day</span>
                            ) : (
                              <span>
                                {ev.start.toLocaleTimeString(undefined, {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}{" "}
                                –{" "}
                                {ev.end.toLocaleTimeString(undefined, {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            )}
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 font-medium capitalize text-blue-700">
                              {ev.type}
                            </span>
                            {ev.location && <span className="truncate">{ev.location}</span>}
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default AgendaView;
