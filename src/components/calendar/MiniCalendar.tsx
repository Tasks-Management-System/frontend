import { getMonthGrid, isSameDay, ymdKey } from "./calendarUtils";

type Props = {
  anchorDate: Date;
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  showMonthNav: boolean;
};

const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const MiniCalendar = ({
  anchorDate,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  showMonthNav,
}: Props) => {
  const today = new Date();
  const grid = getMonthGrid(anchorDate);
  const label = anchorDate.toLocaleString(undefined, { month: "long", year: "numeric" });

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        {showMonthNav ? (
          <button
            type="button"
            onClick={onPrevMonth}
            className="rounded-lg px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
            aria-label="Previous month"
          >
            ‹
          </button>
        ) : (
          <span className="w-8" />
        )}
        <span className="text-sm font-semibold text-gray-800">{label}</span>
        {showMonthNav ? (
          <button
            type="button"
            onClick={onNextMonth}
            className="rounded-lg px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
            aria-label="Next month"
          >
            ›
          </button>
        ) : (
          <span className="w-8" />
        )}
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-medium text-gray-400">
        {weekdays.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {grid.flat().map((cell) => {
          const inMonth = cell.getMonth() === anchorDate.getMonth();
          const isToday = isSameDay(cell, today);
          const isSelected = isSameDay(cell, selectedDate);
          return (
            <button
              key={ymdKey(cell)}
              type="button"
              onClick={() => onSelectDate(new Date(cell))}
              className={`flex h-7 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                !inMonth ? "text-gray-300" : "text-gray-800"
              } ${
                isSelected
                  ? "bg-blue-600 text-white"
                  : isToday
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-100"
              }`}
            >
              {cell.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MiniCalendar;
