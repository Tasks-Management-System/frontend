import MiniCalendar from "./MiniCalendar";
import FilterPanel from "./FilterPanel";
import type { EventFilters } from "../../types/calendar.types";

type Props = {
  miniAnchorDate: Date;
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  onMiniPrevMonth: () => void;
  onMiniNextMonth: () => void;
  showMiniMonthNav: boolean;
  filters: EventFilters;
  onFiltersChange: (f: EventFilters) => void;
};

const CalendarSidebar = ({
  miniAnchorDate,
  selectedDate,
  onSelectDate,
  onMiniPrevMonth,
  onMiniNextMonth,
  showMiniMonthNav,
  filters,
  onFiltersChange,
}: Props) => {
  return (
    <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-64">
      <MiniCalendar
        anchorDate={miniAnchorDate}
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
        onPrevMonth={onMiniPrevMonth}
        onNextMonth={onMiniNextMonth}
        showMonthNav={showMiniMonthNav}
      />
      <FilterPanel filters={filters} onChange={onFiltersChange} />
    </aside>
  );
};

export default CalendarSidebar;
