import {
  CALENDAR_TYPE_ORDER,
  EVENT_COLORS,
  type EventFilters,
  type CalendarEventType,
} from "../../types/calendar.types";

type Props = {
  filters: EventFilters;
  onChange: (next: EventFilters) => void;
};

const labels: Record<CalendarEventType, string> = {
  meeting: "Meeting",
  schedule: "Schedule",
  call: "Call",
  deadline: "Deadline",
  reminder: "Reminder",
  other: "Other",
  leave: "Leave",
  task: "Tasks",
  attendance: "Attendance",
};

const FilterPanel = ({ filters, onChange }: Props) => {
  const toggle = (t: CalendarEventType) => {
    onChange({ ...filters, [t]: !filters[t] });
  };

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Show types
      </h3>
      <ul className="flex flex-col gap-2">
        {CALENDAR_TYPE_ORDER.map((t) => (
          <li key={t}>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={filters[t]}
                onChange={() => toggle(t)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: EVENT_COLORS[t] }}
                aria-hidden
              />
              <span>{labels[t]}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FilterPanel;
