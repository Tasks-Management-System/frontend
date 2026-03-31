/**
 * Base shimmer + composite skeletons for page-level loading states.
 * Global `.skeleton` + `@keyframes skeleton-shimmer` live in `index.css`.
 */

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`skeleton rounded-md ${className}`} aria-hidden />;
}

export function SkeletonText({
  lines = 3,
  className = "",
  lastLineWidth = "w-3/5",
}: {
  lines?: number;
  className?: string;
  lastLineWidth?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3 ${i === lines - 1 ? lastLineWidth : "w-full"}`}
        />
      ))}
    </div>
  );
}

/** Profile page header + tab strip + content columns */
export function ProfilePageSkeleton() {
  return (
    <div className="min-h-screen space-y-4 bg-gray-50 p-3 sm:space-y-6 sm:p-6">
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <Skeleton className="h-32 rounded-none rounded-t-2xl sm:h-40 md:h-44" />
        <div className="px-4 pb-5 pt-2 sm:px-6 sm:pb-6">
          <div className="-mt-14 flex flex-col items-center gap-4 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex w-full flex-col items-center gap-3 sm:flex-row sm:items-end sm:gap-5">
              <Skeleton className="h-24 w-24 shrink-0 rounded-2xl sm:h-28 sm:w-28 md:h-32 md:w-32" />
              <div className="w-full flex-1 space-y-2 text-center sm:text-left">
                <Skeleton className="mx-auto h-8 w-48 sm:mx-0 sm:w-64" />
                <Skeleton className="mx-auto h-4 w-24 sm:mx-0" />
              </div>
            </div>
            <div className="flex w-full max-w-md gap-2 sm:w-auto sm:max-w-none">
              <Skeleton className="h-10 flex-1 rounded-lg sm:h-11 sm:w-28 sm:flex-none" />
              <Skeleton className="h-10 flex-1 rounded-lg sm:h-11 sm:w-32 sm:flex-none" />
            </div>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto border-t border-gray-100 px-4 py-4 sm:px-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-md" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
            <Skeleton className="mb-6 h-6 w-48" />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
            <Skeleton className="mb-4 h-6 w-32" />
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <Skeleton className="h-6 w-10" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Tasks list area (below filters / tabs) */
export function TasksPageSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/90">
              {["Project", "Task", "Description", "Assignee", "Due", "Status"].map(
                (h) => (
                  <th key={h} className="px-4 py-3.5">
                    <Skeleton className="h-3 w-16" />
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {Array.from({ length: 8 }).map((_, r) => (
              <tr key={r}>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-28" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-36" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-full max-w-xs" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-20" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-7 w-20 rounded-full" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function LeaveTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-slate-100">
          {Array.from({ length: 6 }).map((_, c) => (
            <td key={c} className="px-4 py-3">
              <Skeleton className="h-4 w-full max-w-[10rem]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function LeaveInboxTableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-slate-100">
          {Array.from({ length: 6 }).map((_, c) => (
            <td key={c} className="px-4 py-3">
              <Skeleton className="h-4 w-full max-w-[8rem]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/** Week matrix: optional employee column + 7 day cells + total */
export function AttendanceWeekSkeleton({
  isAdmin,
  dayCount = 7,
}: {
  isAdmin?: boolean;
  dayCount?: number;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Skeleton className="h-5 w-40" />
        <div className="flex gap-1">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/90">
              {isAdmin && (
                <th className="px-3 py-3">
                  <Skeleton className="h-3 w-16" />
                </th>
              )}
              {Array.from({ length: dayCount }).map((_, i) => (
                <th key={i} className="px-2 py-3 text-center">
                  <Skeleton className="mx-auto h-3 w-8" />
                </th>
              ))}
              <th className="px-3 py-3 text-center">
                <Skeleton className="mx-auto h-3 w-14" />
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: isAdmin ? 5 : 1 }).map((_, r) => (
              <tr key={r} className="border-b border-slate-100">
                {isAdmin && (
                  <td className="px-3 py-3">
                    <Skeleton className="h-4 w-28" />
                  </td>
                )}
                {Array.from({ length: dayCount }).map((_, c) => (
                  <td key={c} className="px-2 py-3 text-center">
                    <Skeleton className="mx-auto h-4 w-12" />
                  </td>
                ))}
                <td className="px-3 py-3 text-center">
                  <Skeleton className="mx-auto h-4 w-14" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AttendanceDayTableSkeleton({ showUser }: { showUser?: boolean }) {
  const colCount = showUser ? 7 : 6;
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/90">
            {showUser && (
              <th className="px-4 py-3">
                <Skeleton className="h-3 w-16" />
              </th>
            )}
            {Array.from({ length: 6 }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <Skeleton className="h-3 w-14" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {Array.from({ length: 4 }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: colCount }).map((_, c) => (
                <td key={c} className="px-4 py-3">
                  <Skeleton className="h-4 w-full max-w-[6rem]" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Sticky notes: floating “cards” on dotted board */
export function StickyNotesBoardSkeleton() {
  const placeholders = [
    { top: "12%", left: "8%", w: "min(220px,42vw)", h: "140px" },
    { top: "18%", left: "48%", w: "min(200px,38vw)", h: "120px" },
    { top: "42%", left: "15%", w: "min(240px,45vw)", h: "160px" },
    { top: "38%", left: "58%", w: "min(180px,36vw)", h: "130px" },
    { top: "62%", left: "32%", w: "min(210px,40vw)", h: "145px" },
  ];
  return (
    <div className="pointer-events-none absolute inset-0">
      {placeholders.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-xl shadow-md ring-1 ring-gray-200/80"
          style={{
            top: p.top,
            left: p.left,
            width: p.w,
            height: p.h,
          }}
        >
          <Skeleton className="h-full w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

/** Settings / generic data table body */
export function SettingsTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex items-center gap-4 border-b border-gray-100 py-3 last:border-0"
        >
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56 max-w-full" />
          </div>
          <Skeleton className="h-8 w-20 shrink-0 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

/** Sidebar nested project links */
export function SidebarProjectsSkeleton() {
  return (
    <div className="mt-1 space-y-2 border-l border-gray-200/80 ml-4 pl-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 px-2 py-1.5">
          <Skeleton className="h-2 w-2 shrink-0 rounded-full" />
          <Skeleton className="h-3 flex-1 max-w-[9rem]" />
        </div>
      ))}
    </div>
  );
}

/** Calendar main panel (month grid) */
export function CalendarMainSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
      <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="border-r border-gray-100 py-3 text-center last:border-r-0">
            <Skeleton className="mx-auto h-3 w-8" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: 42 }).map((_, i) => (
          <div
            key={i}
            className="min-h-[88px] border-b border-r border-gray-100 p-1.5 last:border-r-0 sm:min-h-[100px]"
          >
            <Skeleton className="mb-2 h-6 w-6 rounded-full" />
            <Skeleton className="mb-1 h-3 w-full" />
            <Skeleton className="h-3 max-w-[80%]" />
          </div>
        ))}
      </div>
    </div>
  );
}
