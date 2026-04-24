import React, { useMemo } from "react";
import { withoutStaleCompletedTasks } from "../../utils/taskStaleHide";

export interface Column<T = Record<string, unknown>> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
}

interface TableProps<T = Record<string, unknown>> {
  columns: Column<T>[];
  data: T[];
  /**
   * When true, rows with `status: "completed"` and `updatedAt` older than 24h are omitted
   * (task-shaped rows only; other tables are unchanged).
   */
  hideStaleCompletedTasks?: boolean;
}

function Table<T = Record<string, unknown>>({
  columns,
  data,
  hideStaleCompletedTasks = false,
}: TableProps<T>) {
  const visibleData = useMemo(
    () =>
      hideStaleCompletedTasks
        ? (withoutStaleCompletedTasks(
            data as unknown as { status?: string; updatedAt?: string | null }[]
          ) as unknown as T[])
        : data,
    [data, hideStaleCompletedTasks]
  );

  const colCount = Math.max(columns.length, 1);
  const gridTemplateColumns = `repeat(${colCount}, minmax(0, 1fr))`;
  /** Avoid squashing many columns into overlapping tracks; scroll horizontally instead. */
  const gridMinWidth = Math.min(1200, Math.max(100, colCount * 140));

  const cellClass = "min-w-0 max-w-full overflow-hidden [overflow-wrap:anywhere] break-words";

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
            {visibleData.map((row, rowIdx) => {
              const r = row as Record<string, unknown>;
              return (
                <div
                  key={String(r.id ?? r._id ?? rowIdx)}
                  className="grid gap-4 px-6 py-4 items-center text-sm text-gray-900 hover:bg-gray-50 transition"
                  style={{ gridTemplateColumns }}
                >
                  {columns.map((col) => (
                    <div key={col.key} className={cellClass}>
                      {col.render ? col.render(row) : (r[col.key] as React.ReactNode)}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-4 text-sm text-gray-500 bg-gray-50 border-t border-gray-100">
        <span>
          Showing {visibleData.length} {visibleData.length === 1 ? "row" : "rows"}
        </span>

        <div className="flex gap-2">
          <button className="w-8 h-8 rounded-lg border hover:bg-gray-100">{"<"}</button>
          <button className="w-8 h-8 rounded-lg border hover:bg-gray-100">{">"}</button>
        </div>
      </div>
    </div>
  );
}

export default Table;
