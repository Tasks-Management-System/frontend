import { getUserId } from "../../utils/auth";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api, ApiError } from "../../apis/apiService";
import { apiPath } from "../../apis/apiPath";
import { getUserById } from "../../apis/api/auth";
import { useCalendarEvents, useInvalidateCalendarEvents } from "../../hooks/useCalendarEvents";
import type { CalendarEvent, CalendarViewMode, EventFilters } from "../../types/calendar.types";
import { CALENDAR_TYPE_ORDER } from "../../types/calendar.types";
import CalendarLayout from "../../components/calendar/CalendarLayout";
import CreateEventModal from "../../components/calendar/CreateEventModal";
import DayEventsModal from "../../components/calendar/DayEventsModal";
import EventDetailModal from "../../components/calendar/EventDetailModal";
import {
  addDays,
  addMonths,
  eventsOnCalendarDay,
  getCalendarEventMongoId,
} from "../../components/calendar/calendarUtils";

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function initialView(): CalendarViewMode {
  if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
    return "agenda";
  }
  return "month";
}

function emptyFilters(): EventFilters {
  return CALENDAR_TYPE_ORDER.reduce((acc, t) => ({ ...acc, [t]: true }), {} as EventFilters);
}

const CalendarPage = () => {
  const userId = getUserId();
  const { data: me } = getUserById(userId);
  const role = me?.role?.[0] ?? "";

  const [view, setView] = useState<CalendarViewMode>(initialView);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [anchorMonth, setAnchorMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [filters, setFilters] = useState<EventFilters>(emptyFilters);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [createDefaultDate, setCreateDefaultDate] = useState<Date | null>(null);
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [dayModalDate, setDayModalDate] = useState<Date | null>(null);

  const rangeStart = useMemo(() => {
    const a = startOfMonth(anchorMonth).getTime();
    const c = startOfMonth(currentDate).getTime();
    return new Date(Math.min(a, c));
  }, [anchorMonth, currentDate]);

  const rangeEnd = useMemo(() => {
    const a = endOfMonth(anchorMonth).getTime();
    const c = endOfMonth(currentDate).getTime();
    return new Date(Math.max(a, c));
  }, [anchorMonth, currentDate]);

  useEffect(() => {
    if (view !== "month") {
      setAnchorMonth(startOfMonth(currentDate));
    }
  }, [currentDate, view]);

  const { events, isLoading, isError } = useCalendarEvents(rangeStart, rangeEnd);
  const invalidateCalendar = useInvalidateCalendarEvents();

  const filteredEvents = useMemo(() => events.filter((e) => filters[e.type]), [events, filters]);

  const canModify = useCallback(
    (ev: CalendarEvent) => {
      if (ev.source !== "calendar") return false;
      const elevated = ["admin", "super-admin"].includes(role);
      const cb =
        typeof ev.createdBy === "object" && ev.createdBy && "_id" in ev.createdBy
          ? (ev.createdBy as { _id: string })._id
          : String(ev.createdBy ?? "");
      return elevated || cb === userId;
    },
    [role, userId]
  );

  const onToday = () => {
    const n = new Date();
    setCurrentDate(n);
    setSelectedDate(n);
    setAnchorMonth(startOfMonth(n));
  };

  const onPrev = () => {
    if (view === "month") {
      setAnchorMonth((m) => addMonths(m, -1));
      setCurrentDate((d) => {
        const x = new Date(d);
        x.setMonth(x.getMonth() - 1);
        return x;
      });
      return;
    }
    if (view === "week") {
      setCurrentDate((d) => addDays(d, -7));
      return;
    }
    if (view === "day") {
      setCurrentDate((d) => addDays(d, -1));
      return;
    }
    setCurrentDate((d) => addDays(d, -7));
  };

  const onNext = () => {
    if (view === "month") {
      setAnchorMonth((m) => addMonths(m, 1));
      setCurrentDate((d) => {
        const x = new Date(d);
        x.setMonth(x.getMonth() + 1);
        return x;
      });
      return;
    }
    if (view === "week") {
      setCurrentDate((d) => addDays(d, 7));
      return;
    }
    if (view === "day") {
      setCurrentDate((d) => addDays(d, 1));
      return;
    }
    setCurrentDate((d) => addDays(d, 7));
  };

  const onSelectMiniDate = (d: Date) => {
    setSelectedDate(d);
    setCurrentDate(d);
    setAnchorMonth(startOfMonth(d));
  };

  const onEventClick = (e: CalendarEvent) => {
    setSelectedEvent(e);
    setDetailOpen(true);
  };

  const openCreateForDay = useCallback((d: Date) => {
    const x = new Date(d);
    x.setHours(9, 0, 0, 0);
    setCreateDefaultDate(x);
    setEditingEvent(null);
    setCreateOpen(true);
  }, []);

  const handleCalendarDayClick = useCallback(
    (d: Date) => {
      setSelectedDate(d);
      setCurrentDate(d);
      const dayEvents = eventsOnCalendarDay(d, filteredEvents);
      if (dayEvents.length === 0) {
        openCreateForDay(d);
      } else {
        setDayModalDate(d);
        setDayModalOpen(true);
      }
    },
    [filteredEvents, openCreateForDay]
  );

  const onMonthMoreClick = (d: Date) => {
    setCurrentDate(d);
    setSelectedDate(d);
    setView("day");
  };

  const onWeekSlotClick = (d: Date, hour: number, minute: number) => {
    const dt = new Date(d);
    dt.setHours(hour, minute, 0, 0);
    setCreateDefaultDate(dt);
    setEditingEvent(null);
    setCreateOpen(true);
  };

  const onDaySlotClick = (d: Date, hour: number, minute: number) => {
    onWeekSlotClick(d, hour, minute);
  };

  const onEventDrop = async (ev: CalendarEvent, newDate: Date) => {
    if (ev.source !== "calendar") return;
    const id = getCalendarEventMongoId(ev);
    if (!id) return;

    // Calculate the time difference and apply to both start and end
    const oldStart = new Date(ev.start);
    const dayDiff = Math.round(
      (newDate.getTime() -
        new Date(oldStart.getFullYear(), oldStart.getMonth(), oldStart.getDate()).getTime()) /
        (24 * 60 * 60 * 1000)
    );
    if (dayDiff === 0) return;

    const newStart = new Date(ev.start);
    newStart.setDate(newStart.getDate() + dayDiff);
    const newEnd = new Date(ev.end);
    newEnd.setDate(newEnd.getDate() + dayDiff);

    try {
      await api.put(apiPath.events.byId + id, {
        start: newStart.toISOString(),
        end: newEnd.toISOString(),
      });
      toast.success("Event rescheduled");
      invalidateCalendar();
    } catch (err) {
      toast.error((err as ApiError)?.message ?? "Could not reschedule event");
    }
  };

  const onDelete = async (ev: CalendarEvent) => {
    const id = getCalendarEventMongoId(ev);
    if (!id) {
      toast.error("Cannot delete this item from the calendar.");
      return;
    }
    try {
      await api.del(apiPath.events.byId + id);
      toast.success("Event deleted");
      invalidateCalendar();
      setDetailOpen(false);
      setSelectedEvent(null);
    } catch (err) {
      toast.error((err as ApiError)?.message ?? "Delete failed");
    }
  };

  const onEditFromDetail = (ev: CalendarEvent) => {
    setEditingEvent(ev);
    setCreateDefaultDate(null);
    setDetailOpen(false);
    setCreateOpen(true);
  };

  if (isError) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-sm text-red-800">
        Could not load calendar data. Please refresh or try again later.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CalendarLayout
        view={view}
        showMiniMonthNav={view === "month"}
        onViewChange={setView}
        anchorMonth={anchorMonth}
        currentDate={currentDate}
        selectedDate={selectedDate}
        onToday={onToday}
        onPrev={onPrev}
        onNext={onNext}
        onSelectDate={onSelectMiniDate}
        onMiniPrevMonth={() => setAnchorMonth((m) => addMonths(m, -1))}
        onMiniNextMonth={() => setAnchorMonth((m) => addMonths(m, 1))}
        filters={filters}
        onFiltersChange={setFilters}
        filteredEvents={filteredEvents}
        onMonthDayClick={handleCalendarDayClick}
        onCalendarDayClick={handleCalendarDayClick}
        onMonthMoreClick={onMonthMoreClick}
        onWeekSlotClick={onWeekSlotClick}
        onDaySlotClick={onDaySlotClick}
        onEventClick={onEventClick}
        onEventDrop={onEventDrop}
        isLoading={isLoading}
      />

      <DayEventsModal
        open={dayModalOpen}
        date={dayModalDate}
        events={dayModalDate ? eventsOnCalendarDay(dayModalDate, filteredEvents) : []}
        onClose={() => {
          setDayModalOpen(false);
          setDayModalDate(null);
        }}
        onAddEvent={() => {
          if (!dayModalDate) return;
          const d = new Date(dayModalDate);
          setDayModalOpen(false);
          setDayModalDate(null);
          openCreateForDay(d);
        }}
        onEventOpen={(ev) => {
          setDayModalOpen(false);
          setDayModalDate(null);
          setSelectedEvent(ev);
          setDetailOpen(true);
        }}
      />

      <EventDetailModal
        open={detailOpen}
        event={selectedEvent}
        onClose={() => {
          setDetailOpen(false);
          setSelectedEvent(null);
        }}
        onEdit={onEditFromDetail}
        onDelete={onDelete}
        canModify={selectedEvent ? canModify(selectedEvent) : false}
      />

      <CreateEventModal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setEditingEvent(null);
        }}
        onSuccess={invalidateCalendar}
        editingEvent={editingEvent}
        defaultDateTime={createDefaultDate}
      />
    </div>
  );
};

export default CalendarPage;
