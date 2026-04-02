import React, { useMemo } from "react";
import { withoutStaleCompletedTasks } from "../../utils/taskStaleHide";

interface Column {
  key: string;
  label: string;
  render?: (row: any) => React.ReactNode;
}

interface TableProps {
  columns: Column[];
  data: any[];
  /**
   * When true, rows with `status: "completed"` and `updatedAt` older than 24h are omitted
   * (task-shaped rows only; other tables are unchanged).
   */
  hideStaleCompletedTasks?: boolean;
}

const Table: React.FC<TableProps> = ({
  columns,
  data,
  hideStaleCompletedTasks = false,
}) => {
  const visibleData = useMemo(
    () =>
      hideStaleCompletedTasks ? withoutStaleCompletedTasks(data) : data,
    [data, hideStaleCompletedTasks]
  );

  const colCount = Math.max(columns.length, 1);
  const gridTemplateColumns = `repeat(${colCount}, minmax(0, 1fr))`;
  /** Avoid squashing many columns into overlapping tracks; scroll horizontally instead. */
  const gridMinWidth = Math.min(1200, Math.max(100, colCount * 140));

  const cellClass =
    "min-w-0 max-w-full overflow-hidden [overflow-wrap:anywhere] break-words";

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <div style={{ minWidth: gridMinWidth }}>
          {/* Header — same column template as rows so cells line up under headers */}
          <div
            className="grid gap-4 px-6 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide"
            style={{ gridTemplateColumns }}
          >
            {columns.map((col) => (
              <div key={col.key} className={cellClass}>
                {col.label}
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-100">
            {visibleData.map((row) => (
              <div
                key={row.id ?? row._id}
                className="grid gap-4 px-6 py-4 items-center text-sm text-gray-900 hover:bg-gray-50 transition"
                style={{ gridTemplateColumns }}
              >
                {columns.map((col) => (
                  <div key={col.key} className={cellClass}>
                    {col.render ? col.render(row) : row[col.key]}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-4 text-sm text-gray-500 bg-gray-50 border-t border-gray-100">
        <span>
          Showing {visibleData.length}{" "}
          {visibleData.length === 1 ? "row" : "rows"}
        </span>

        <div className="flex gap-2">
          <button className="w-8 h-8 rounded-lg border hover:bg-gray-100">
            {"<"}
          </button>
          <button className="w-8 h-8 rounded-lg border hover:bg-gray-100">
            {">"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Table;