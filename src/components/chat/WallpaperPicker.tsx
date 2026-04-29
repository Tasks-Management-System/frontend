import { useRef } from "react";
import { Check, ImagePlus, X, Trash2 } from "lucide-react";
import { WALLPAPER_PRESETS, type WallpaperValue } from "../../hooks/useChatWallpaper";

type Props = {
  current: WallpaperValue;
  onChange: (value: WallpaperValue) => void;
  onClose: () => void;
};

export default function WallpaperPicker({ current, onChange, onClose }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">Wallpaper</p>
          <p className="text-xs text-gray-400">Set a background for this chat</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Gradient presets */}
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Gradient Presets
        </p>
        <div className="grid grid-cols-2 gap-3">
          {WALLPAPER_PRESETS.map((preset) => {
            const isActive = current === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onChange(preset.id)}
                className={`group relative overflow-hidden rounded-2xl transition-all duration-200 hover:scale-[1.03] hover:shadow-lg ${
                  isActive
                    ? "shadow-lg ring-2 ring-violet-500 ring-offset-2"
                    : "ring-1 ring-gray-200 hover:ring-violet-300"
                }`}
              >
                {/* Swatch */}
                <div className="h-20 w-full" style={{ background: preset.swatch }} />

                {/* Label row */}
                <div
                  className={`flex items-center justify-between px-2.5 py-1.5 ${
                    preset.id === "midnight" || preset.id === "charcoal"
                      ? "bg-gray-800 text-gray-300"
                      : "bg-gray-50 text-gray-600"
                  }`}
                >
                  <span className="text-[11px] font-medium">{preset.label}</span>
                  {isActive && (
                    <Check
                      className={`h-3.5 w-3.5 ${
                        preset.id === "midnight" || preset.id === "charcoal"
                          ? "text-violet-400"
                          : "text-violet-600"
                      }`}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom image */}
        <div className="mt-5">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            Custom Image
          </p>

          {/* Show current custom image preview if set */}
          {current.startsWith("data:") && (
            <div className="mb-3 overflow-hidden rounded-2xl ring-2 ring-violet-500 ring-offset-2">
              <div className="relative">
                <img src={current} alt="Current wallpaper" className="h-32 w-full object-cover" />
                <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/60 to-transparent p-2.5">
                  <span className="flex items-center gap-1 text-[11px] font-medium text-white">
                    <Check className="h-3 w-3" /> Active
                  </span>
                  <button
                    type="button"
                    onClick={() => onChange("none")}
                    className="flex items-center gap-1 rounded-lg bg-white/20 px-2 py-1 text-[11px] text-white backdrop-blur-sm hover:bg-white/30"
                  >
                    <Trash2 className="h-3 w-3" />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-gray-200 py-4 text-sm text-gray-500 transition hover:border-violet-400 hover:bg-violet-50 hover:text-violet-600"
          >
            <ImagePlus className="h-4 w-4" />
            <span>{current.startsWith("data:") ? "Change image" : "Upload image"}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>
    </div>
  );
}
