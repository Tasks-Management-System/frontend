import { Download } from "lucide-react";
import type { CalendarEvent, CalendarViewMode, EventFilters } from "../../types/calendar.types";
import { addDays, startOfWeekSunday } from "./calendarUtils";
import { exportToIcs } from "./icsExport";
import CalendarSidebar from "./CalendarSidebar";
import MonthView from "./MonthView";
import WeekView from "./WeekView";
import DayView from "./DayView";
import AgendaView from "./AgendaView";
import { CalendarMainSkeleton } from "../UI/Skeleton";

type Props = {
  view: CalendarViewMode;
  showMiniMonthNav: boolean;
  onViewChange: (v: CalendarViewMode) => void;
  anchorMonth: Date;
  currentDate: Date;
  selectedDate: Date;
  onToday: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSelectDate: (d: Date) => void;
  onMiniPrevMonth: () => void;
  onMiniNextMonth: () => void;
  filters: EventFilters;
  onFiltersChange: (f: EventFilters) => void;
  filteredEvents: CalendarEvent[];
  onMonthDayClick: (d: Date) => void;
  onMonthMoreClick: (d: Date) => void;
  onCalendarDayClick: (d: Date) => void;
  onWeekSlotClick: (d: Date, hour: number, minute: number) => void;
  onDaySlotClick: (d: Date, hour: number, minute: number) => void;
  onEventClick: (e: CalendarEvent) => void;
  onEventDrop?: (event: CalendarEvent, newDate: Date) => void;
  isLoading?: boolean;
};

function titleForView(view: CalendarViewMode, currentDate: Date, anchorMonth: Date) {
  if (view === "month") {
    return anchorMonth.toLocaleString(undefined, { month: "long", year: "numeric" });
  }
  if (view === "week") {
    const ws = startOfWeekSunday(currentDate);
    const we = addDays(ws, 6);
    const sameY = ws.getFullYear() === we.getFullYear();
    const a = ws.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: sameY ? undefined : "numeric",
    });
    const b = we.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    return `${a} – ${b}`;
  }
  if (view === "day") {
    return currentDate.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }
  return "Agenda";
}

const tabs: { id: CalendarViewMode; label: string }[] = [
  { id: "month", label: "Month" },
  { id: "week", label: "Week" },
  { id: "day", label: "Day" },
  { id: "agenda", label: "Agenda" },
];

const CalendarLayout = ({
  view,
  showMiniMonthNav,
  onViewChange,
  anchorMonth,
  currentDate,
  selectedDate,
  onToday,
  onPrev,
  onNext,
  onSelectDate,
  onMiniPrevMonth,
  onMiniNextMonth,
  filters,
  onFiltersChange,
  filteredEvents,
  onMonthDayClick,
  onMonthMoreClick,
  onCalendarDayClick,
  onWeekSlotClick,
  onDaySlotClick,
  onEventClick,
  onEventDrop,
  isLoading,
}: Props) => {
  const title = titleForView(view, currentDate, anchorMonth);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
      <div className="hidden shrink-0 lg:block">
        <CalendarSidebar
          miniAnchorDate={anchorMonth}
          selectedDate={selectedDate}
          onSelectDate={onSelectDate}
          onMiniPrevMonth={onMiniPrevMonth}
          onMiniNextMonth={onMiniNextMonth}
          showMiniMonthNav={showMiniMonthNav}
          filters={filters}
          onFiltersChange={onFiltersChange}
        />
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <div className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onToday}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Today
            </button>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onPrev}
                className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
                aria-label="Previous"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={onNext}
                className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
                aria-label="Next"
              >
                ›
              </button>
            </div>
            <h1 className="text-lg font-semibold text-gray-900 sm:ml-2">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex flex-wrap gap-1 rounded-lg bg-gray-100 p-1">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onViewChange(t.id)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    view === t.id ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => exportToIcs(filteredEvents)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              title="Export to .ics (Google Calendar, Outlook)"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">.ics</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <CalendarMainSkeleton />
        ) : (
          <>
            {view === "month" && (
              <MonthView
                monthAnchor={anchorMonth}
                events={filteredEvents}
                selectedDate={selectedDate}
                onDayClick={onMonthDayClick}
                onMoreClick={onMonthMoreClick}
                onEventClick={onEventClick}
                onEventDrop={onEventDrop}
              />
            )}
            {view === "week" && (
              <WeekView
                weekAnchor={currentDate}
                events={filteredEvents}
                onSlotClick={onWeekSlotClick}
                onEventClick={onEventClick}
                onDayHeaderClick={onCalendarDayClick}
              />
            )}
            {view === "day" && (
              <DayView
                day={currentDate}
                events={filteredEvents}
                onSlotClick={onDaySlotClick}
                onEventClick={onEventClick}
                onDayTitleClick={onCalendarDayClick}
              />
            )}
            {view === "agenda" && (
              <AgendaView
                fromDay={currentDate}
                events={filteredEvents}
                onEventClick={onEventClick}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CalendarLayout;
