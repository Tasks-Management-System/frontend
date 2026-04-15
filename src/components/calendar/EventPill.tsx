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
      className={`flex w-full max-w-full items-center gap-1.5 rounded-md border-l-[3px] px-1.5 py-0.5 text-left text-[11px] font-medium shadow-sm hover:shadow-md transition-shadow ${className}`}
      style={{
        borderLeftColor: event.color,
        backgroundColor: event.color + "15",
        color: event.color,
      }}
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: event.color }}
      />
      <span className="min-w-0 flex-1 truncate" style={{ color: "#1f2937" }}>
        {event.title}
      </span>
    </button>
  );
};

export default EventPill;
