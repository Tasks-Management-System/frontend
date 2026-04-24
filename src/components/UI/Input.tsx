import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightLabel?: React.ReactNode;
  type?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  type = "text",
  className = "",
  rightLabel,
  value,
  onChange,
  name,
  placeholder,
  ...rest
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const isTextarea = type === "textarea";

  return (
    <div className="flex flex-col gap-1 w-full">
      {/* LABEL */}
      {label && (
        <label className="text-sm font-medium text-gray-700 flex justify-between">
          {label}
          {rightLabel && <span className="text-sm text-gray-500">{rightLabel}</span>}
        </label>
      )}

      <div className="relative">
        {/* ICON */}
        {icon && !isTextarea && (
          <span className="absolute left-3 top-2.5 text-gray-400">{icon}</span>
        )}

        {/* TEXTAREA */}
        {isTextarea ? (
          <textarea
            value={(value as string) || ""} // ✅ FIX
            onChange={onChange as unknown as React.ChangeEventHandler<HTMLTextAreaElement>}
            name={name}
            placeholder={placeholder}
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg outline-none transition resize-none
              focus:ring-2 focus:ring-blue-500
              ${error ? "border-red-500" : "border-gray-300"}
              ${className}`}
          />
        ) : (
          /* INPUT */
          <input
            type={isPassword && showPassword ? "text" : type}
            value={(value as string) || ""} // ✅ FIX (MAIN ISSUE)
            onChange={onChange} // ✅ FIX
            name={name}
            placeholder={placeholder}
            className={`w-full px-3 py-2 border rounded-lg outline-none transition 
              focus:ring-2 focus:ring-blue-500
              ${icon ? "pl-10" : ""}
              ${isPassword ? "pr-10" : ""}
              ${error ? "border-red-500" : "border-gray-300"}
              ${className}`}
            {...rest}
          />
        )}

        {/* PASSWORD TOGGLE */}
        {isPassword && !isTextarea && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2.5 text-gray-400"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {/* ERROR */}
      {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
    </div>
  );
};

export default Input;
