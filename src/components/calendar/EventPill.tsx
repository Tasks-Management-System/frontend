import type { CalendarEvent } from "../../types/calendar.types";

type Props = {
  event: CalendarEvent;
  onClick: (e: CalendarEvent) => void;
  className?: string;
};

const EventPill = ({ event, onClick, className = "" }: Props) => {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(event);
      }}
      className={`flex w-full max-w-full items-center gap-1 rounded-sm border border-gray-100 border-l-2 bg-white px-1.5 py-0.5 text-left text-[11px] font-medium text-gray-800 shadow-sm hover:bg-gray-50 ${className}`}
      style={{ borderLeftColor: event.color }}
    >
      <span className="min-w-0 flex-1 truncate">{event.title}</span>
    </button>
  );
};

export default EventPill;
