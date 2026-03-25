import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type PillTabItem = {
  key: string;
  label: string;
  icon?: ReactNode;
};

type PillTabBarProps = {
  items: PillTabItem[];
  activeKey: string;
  onTabChange: (key: string) => void;
  /** For layouts that need a ref on each tab button (e.g. future measurements). */
  tabRef?: (index: number) => (el: HTMLButtonElement | null) => void;
  /** `sm` = compact toolbar (e.g. Cards / Board on Tasks). */
  size?: "sm" | "md";
  className?: string;
};

/**
 * Segmented control: white pill rail, lavender sliding chip (#F3F0FF) with smooth motion.
 */
export function PillTabBar({
  items,
  activeKey,
  onTabChange,
  tabRef,
  size = "md",
  className = "",
}: PillTabBarProps) {
  const isSm = size === "sm";
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const updateIndicator = useCallback(() => {
    const container = containerRef.current;
    const idx = items.findIndex((i) => i.key === activeKey);
    const btn = btnRefs.current[idx];
    if (!container || !btn) return;

    const cr = container.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    setIndicator({
      left: br.left - cr.left + container.scrollLeft,
      width: br.width,
    });
  }, [activeKey, items]);

  useLayoutEffect(() => {
    updateIndicator();
  }, [updateIndicator]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => updateIndicator());
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateIndicator]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => updateIndicator();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [updateIndicator]);

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex max-w-full flex-nowrap overflow-x-auto rounded-full border border-gray-200/80 bg-white p-1 shadow-[0_8px_30px_rgba(15,23,42,0.05)] backdrop-blur-sm ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-y-1 rounded-full bg-[#F3F0FF] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] ring-1 ring-violet-200/60 transition-[left,width,opacity] duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] will-change-[left,width]"
        style={{
          left: indicator.left,
          width: indicator.width,
          opacity: indicator.width > 0 ? 1 : 0,
        }}
        aria-hidden
      />
      {items.map((item, index) => (
        <button
          key={item.key}
          ref={(el) => {
            btnRefs.current[index] = el;
            tabRef?.(index)(el);
          }}
          type="button"
          onClick={() => onTabChange(item.key)}
          className={`relative z-10 shrink-0 rounded-full font-medium transition-colors duration-200 ease-out ${
            isSm ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
          } ${
            activeKey === item.key
              ? "text-gray-900"
              : "text-[#5E6C84] hover:text-gray-800"
          }`}
        >
          <span
            className={`relative inline-flex items-center justify-center whitespace-nowrap ${isSm ? "gap-1.5" : "gap-2"}`}
          >
            {item.icon}
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
}
