import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface Option {
  label: string;
  value: string;
}

interface DropdownProps {
  label?: string;
  placeholder?: string;
  options: Option[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
}

const Dropdown = ({
  label,
  placeholder = "Select option",
  options,
  value,
  onChange,
  error,
}: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // 👉 Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-full relative" ref={dropdownRef}>
      {/* Label */}
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`
          mt-1 w-full flex items-center justify-between
          px-3 py-2 rounded-lg border text-sm bg-white
          transition-all duration-200
          ${error ? "border-red-500" : "border-gray-300 hover:border-gray-400"}
          focus:ring-2 focus:ring-violet-500
        `}
      >
        <span className={selectedOption ? "text-gray-900" : "text-gray-400"}>
          {selectedOption?.label || placeholder}
        </span>

        <ChevronDown
          className={`w-4 h-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* 🔥 Floating Dropdown */}
      {isOpen && (
        <div
          className="
            absolute left-0 top-full mt-1 w-full
            bg-white border border-gray-200 rounded-lg
            shadow-[0_10px_30px_rgba(0,0,0,0.1)]
            z-[999]
            max-h-48 overflow-y-auto
            animate-in fade-in zoom-in-95
          "
        >
          {options.length > 0 ? (
            options.map((opt) => (
              <div
                key={opt.value}
                onClick={() => {
                  onChange?.(opt.value);
                  setIsOpen(false);
                }}
                className={`
                  px-3 py-2 text-sm cursor-pointer transition
                  hover:bg-gray-100
                  ${
                    value === opt.value
                      ? "bg-violet-50 text-violet-700 font-medium"
                      : "text-gray-700"
                  }
                `}
              >
                {opt.label}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-400">No options</div>
          )}
        </div>
      )}

      {/* Error */}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default Dropdown;
