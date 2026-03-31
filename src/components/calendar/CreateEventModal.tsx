import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api, ApiError } from "../../apis/apiService";
import { apiPath } from "../../apis/apiPath";
import { useAssignableUsers } from "../../apis/api/auth";
import type { User } from "../../types/user.types";
import type { CalendarEvent } from "../../types/calendar.types";
import { EVENT_COLORS, SWATCH_COLORS } from "../../types/calendar.types";
import { getCalendarEventMongoId } from "./calendarUtils";

type CalType =
  | "meeting"
  | "schedule"
  | "call"
  | "deadline"
  | "reminder"
  | "other";

const TYPE_GRID: { key: CalType; label: string }[] = [
  { key: "meeting", label: "Meeting" },
  { key: "schedule", label: "Schedule" },
  { key: "call", label: "Call" },
  { key: "deadline", label: "Deadline" },
  { key: "reminder", label: "Reminder" },
  { key: "other", label: "Other" },
];

const RECURRENCE_OPTIONS: { value: string; label: string }[] = [
  { value: "none", label: "Does not repeat" },
  { value: "daily", label: "Every day" },
  { value: "weekly", label: "Every week" },
  { value: "biweekly", label: "Every 2 weeks" },
  { value: "monthly", label: "Every month" },
];

const REMINDER_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: "No reminder" },
  { value: 5, label: "5 minutes before" },
  { value: 10, label: "10 minutes before" },
  { value: 15, label: "15 minutes before" },
  { value: 30, label: "30 minutes before" },
  { value: 60, label: "60 minutes before" },
  { value: 1440, label: "1 day before" },
];

type Attendee = { userId: string; name: string; email: string };

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** When set, opens in edit mode for this calendar event */
  editingEvent: CalendarEvent | null;
  /** Default date/time for new events (from grid click) */
  defaultDateTime: Date | null;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toDateInput(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toTimeInput(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const CreateEventModal = ({
  open,
  onClose,
  onSuccess,
  editingEvent,
  defaultDateTime,
}: Props) => {
  const { data: users = [] } = useAssignableUsers();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<CalType>("meeting");
  const [dateStr, setDateStr] = useState(toDateInput(new Date()));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [color, setColor] = useState(SWATCH_COLORS[0]);
  const [recurrence, setRecurrence] = useState("none");
  const [reminderMinutes, setReminderMinutes] = useState(15);
  const [reminderSent, setReminderSent] = useState(false);
  const [visibleToTeam, setVisibleToTeam] = useState(true);
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users.slice(0, 8);
    return users
      .filter(
        (u) =>
          u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [users, search]);

  useEffect(() => {
    if (!open) return;

    if (editingEvent && editingEvent.source === "calendar") {
      const ev = editingEvent;
      setTitle(ev.title);
      const t = TYPE_GRID.some((x) => x.key === ev.type) ? (ev.type as CalType) : "other";
      setType(t);
      setDateStr(toDateInput(ev.start));
      setStartTime(toTimeInput(ev.start));
      setEndTime(toTimeInput(ev.end));
      setAllDay(ev.allDay);
      setLocation(ev.location ?? "");
      setDescription(ev.description ?? "");
      setColor(ev.color || SWATCH_COLORS[0]);
      setRecurrence(ev.recurrence ?? "none");
      setReminderMinutes(ev.reminderMinutes ?? 15);
      setReminderSent(ev.reminderSent === true);
      setVisibleToTeam(ev.visibleToTeam !== false);
      setAttendees(
        (ev.attendees ?? []).map((a) => ({
          userId: a.userId || "",
          name: a.name || "",
          email: a.email || "",
        }))
      );
      setSearch("");
      return;
    }

    const base = defaultDateTime ? new Date(defaultDateTime) : new Date();
    setTitle("");
    setType("meeting");
    setDateStr(toDateInput(base));
    setStartTime(toTimeInput(base));
    const end = new Date(base);
    end.setHours(end.getHours() + 1);
    setEndTime(toTimeInput(end));
    setAllDay(false);
    setLocation("");
    setDescription("");
    setColor(SWATCH_COLORS[0]);
    setRecurrence("none");
      setReminderMinutes(15);
      setReminderSent(false);
      setVisibleToTeam(true);
    setAttendees([]);
    setSearch("");
  }, [open, editingEvent, defaultDateTime]);

  const addUser = (u: User) => {
    if (attendees.some((a) => a.userId === u._id)) return;
    setAttendees((prev) => [
      ...prev,
      { userId: u._id, name: u.name, email: u.email },
    ]);
    setSearch("");
  };

  const removeAttendee = (userId: string) => {
    setAttendees((prev) => prev.filter((a) => a.userId !== userId));
  };

  const buildStartEnd = () => {
    const [y, m, d] = dateStr.split("-").map(Number);
    if (allDay) {
      const start = new Date(y, m - 1, d, 0, 0, 0, 0);
      const end = new Date(y, m - 1, d, 23, 59, 59, 999);
      return { start, end };
    }
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const start = new Date(y, m - 1, d, sh, sm, 0, 0);
    const end = new Date(y, m - 1, d, eh, em, 0, 0);
    return { start, end };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    const { start, end } = buildStartEnd();
    if (end < start) {
      toast.error("End time must be after start");
      return;
    }

    const body = {
      title: title.trim(),
      type,
      start: start.toISOString(),
      end: end.toISOString(),
      allDay,
      location: location.trim(),
      description: description.trim(),
      attendees: attendees.filter((a) => a.userId),
      color,
      recurrence,
      reminderMinutes,
      ...(editingEvent?.source === "calendar"
        ? { reminderSent }
        : {}),
      visibleToTeam,
    };

    setSubmitting(true);
    try {
      if (editingEvent?.source === "calendar") {
        const id = getCalendarEventMongoId(editingEvent);
        if (!id) throw new Error("Missing event id");
        await api.put(apiPath.events.byId + id, body);
        toast.success("Event updated");
      } else {
        await api.post(apiPath.events.list, body);
        toast.success("Event created");
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error((err as ApiError)?.message ?? "Could not save event");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/30"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative max-h-[min(90dvh,800px)] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingEvent ? "Edit event" : "Create event"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Event title"
            />
          </div>

          <div>
            <span className="mb-2 block text-xs font-semibold text-gray-500">Type</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {TYPE_GRID.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setType(key)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-medium transition ${
                    type === key
                      ? "border-blue-500 bg-blue-50 text-blue-800"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: EVENT_COLORS[key] }}
                    aria-hidden
                  />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">Date</label>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end gap-2">
              <label className="flex flex-1 flex-col gap-1">
                <span className="text-xs font-semibold text-gray-500">Start</span>
                <input
                  type="time"
                  disabled={allDay}
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </label>
              <label className="flex flex-1 flex-col gap-1">
                <span className="text-xs font-semibold text-gray-500">End</span>
                <input
                  type="time"
                  disabled={allDay}
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </label>
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            All day
          </label>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <span className="mb-1 block text-xs font-semibold text-gray-500">Attendees</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users…"
              className="mb-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {search.trim() && filteredUsers.length > 0 && (
              <ul className="mb-2 max-h-32 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50 text-sm">
                {filteredUsers.map((u) => (
                  <li key={u._id}>
                    <button
                      type="button"
                      onClick={() => addUser(u)}
                      className="w-full px-3 py-2 text-left hover:bg-white"
                    >
                      {u.name} <span className="text-gray-500">({u.email})</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap gap-2">
              {attendees.map((a) => (
                <span
                  key={a.userId}
                  className="inline-flex items-center gap-2 rounded-full bg-gray-100 py-1 pl-1 pr-2 text-xs font-medium text-gray-800"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-300 text-[10px]">
                    {initials(a.name || a.email)}
                  </span>
                  {a.name}
                  <button
                    type="button"
                    onClick={() => removeAttendee(a.userId)}
                    className="text-gray-500 hover:text-gray-900"
                    aria-label="Remove"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="mb-2 block text-xs font-semibold text-gray-500">Color</span>
            <div className="flex flex-wrap gap-2">
              {SWATCH_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full border-2 shadow-sm ${
                    color === c ? "border-gray-900" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">Repeat</label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {RECURRENCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">Reminder</label>
              <select
                value={reminderMinutes}
                onChange={(e) => setReminderMinutes(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {REMINDER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {editingEvent?.source === "calendar" && (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={reminderSent}
                onChange={(e) => setReminderSent(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Reminder already sent (skip email reminder)
            </label>
          )}

          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={visibleToTeam}
              onChange={(e) => setVisibleToTeam(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Visible to team
          </label>

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Saving…" : editingEvent ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default CreateEventModal;
