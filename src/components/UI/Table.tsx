import React from "react";

interface Column {
  key: string;
  label: string;
  render?: (row: any) => React.ReactNode;
}

interface TableProps {
  columns: Column[];
  data: any[];
}

const Table: React.FC<TableProps> = ({ columns, data }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      
      {/* Header */}
      <div className="grid grid-cols-5 px-6 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
        {columns.map((col) => (
          <div key={col.key}>{col.label}</div>
        ))}
      </div>

      {/* Rows */}
      <div className="divide-y">
        {data.map((row) => (
          <div
            key={row.id}
            className="grid grid-cols-5 px-6 py-4 items-center text-sm hover:bg-gray-50 transition"
          >
            {columns.map((col) => (
              <div key={col.key}>
                {col.render ? col.render(row) : row[col.key]}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-4 text-sm text-gray-500 bg-gray-50">
        <span>Showing {data.length} tasks</span>

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