import { useState, useCallback } from "react";
import { getUserId } from "../utils/session";

export type WallpaperValue = string; // preset id or data:image/... URL

export type WallpaperPreset = {
  id: string;
  label: string;
  swatch: string; // CSS background value for the small preview tile
  style: React.CSSProperties; // applied to the message area
};

export const WALLPAPER_PRESETS: WallpaperPreset[] = [
  {
    id: "none",
    label: "Default",
    swatch: "linear-gradient(to bottom, #f9fafb, #ffffff)",
    style: {},
  },
  {
    id: "violet-mist",
    label: "Violet Mist",
    swatch: "linear-gradient(135deg, #ede9fe, #f5f3ff)",
    style: { background: "linear-gradient(135deg, #ede9fe 0%, #f5f3ff 50%, #fff 100%)" },
  },
  {
    id: "ocean",
    label: "Ocean",
    swatch: "linear-gradient(135deg, #dbeafe, #cffafe)",
    style: { background: "linear-gradient(135deg, #dbeafe 0%, #cffafe 60%, #f0f9ff 100%)" },
  },
  {
    id: "sunset",
    label: "Sunset",
    swatch: "linear-gradient(135deg, #fef3c7, #fce7f3)",
    style: { background: "linear-gradient(135deg, #fef3c7 0%, #fce7f3 60%, #fff1f2 100%)" },
  },
  {
    id: "forest",
    label: "Forest",
    swatch: "linear-gradient(135deg, #d1fae5, #ccfbf1)",
    style: { background: "linear-gradient(135deg, #d1fae5 0%, #ccfbf1 60%, #f0fdf4 100%)" },
  },
  {
    id: "rose",
    label: "Rose",
    swatch: "linear-gradient(135deg, #ffe4e6, #fce7f3)",
    style: { background: "linear-gradient(135deg, #ffe4e6 0%, #fce7f3 60%, #fff 100%)" },
  },
  {
    id: "sky",
    label: "Sky",
    swatch: "linear-gradient(135deg, #e0f2fe, #bae6fd)",
    style: { background: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 50%, #f0f9ff 100%)" },
  },
  {
    id: "peach",
    label: "Peach",
    swatch: "linear-gradient(135deg, #ffedd5, #fef3c7)",
    style: { background: "linear-gradient(135deg, #ffedd5 0%, #fef3c7 60%, #fff 100%)" },
  },
  {
    id: "midnight",
    label: "Midnight",
    swatch: "linear-gradient(135deg, #1e1b4b, #312e81)",
    style: { background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #1e3a5f 100%)" },
  },
  {
    id: "charcoal",
    label: "Charcoal",
    swatch: "linear-gradient(135deg, #1f2937, #374151)",
    style: { background: "linear-gradient(135deg, #1f2937 0%, #374151 60%, #111827 100%)" },
  },
];

export function getWallpaperStyle(wallpaper: WallpaperValue): React.CSSProperties {
  if (!wallpaper || wallpaper === "none") return {};
  if (wallpaper.startsWith("data:")) {
    return {
      backgroundImage: `url(${wallpaper})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  return WALLPAPER_PRESETS.find((p) => p.id === wallpaper)?.style ?? {};
}

/** Storage key is per logged-in user × per conversation partner — so each
 *  chat thread can have its own independent wallpaper. */
function storageKey(otherUserId: string) {
  return `chatWallpaper_${getUserId()}_${otherUserId}`;
}

type WallpaperState = { otherUserId: string; wallpaper: WallpaperValue };

function readFromStorage(otherUserId: string): WallpaperValue {
  if (!otherUserId) return "none";
  return localStorage.getItem(storageKey(otherUserId)) ?? "none";
}

/**
 * useChatWallpaper(otherUserId)
 *
 * Returns the wallpaper set for the conversation with `otherUserId` and a
 * setter that persists it to localStorage.  Automatically re-reads from
 * storage when `otherUserId` changes (i.e. when the user switches chats).
 */
export function useChatWallpaper(otherUserId: string) {
  const [state, setState] = useState<WallpaperState>(() => ({
    otherUserId,
    wallpaper: readFromStorage(otherUserId),
  }));

  // React-recommended pattern: update state synchronously during render when
  // the derived key changes, avoiding an extra useEffect.
  if (state.otherUserId !== otherUserId) {
    setState({ otherUserId, wallpaper: readFromStorage(otherUserId) });
  }

  const setWallpaper = useCallback(
    (value: WallpaperValue) => {
      setState((prev) => ({ ...prev, wallpaper: value }));
      if (otherUserId) {
        if (value === "none") {
          localStorage.removeItem(storageKey(otherUserId));
        } else {
          localStorage.setItem(storageKey(otherUserId), value);
        }
      }
    },
    [otherUserId]
  );

  return { wallpaper: state.wallpaper, setWallpaper };
}
