import WallpaperPicker from "../../components/chat/WallpaperPicker";
import type { WallpaperValue } from "../../hooks/useChatWallpaper";

type ChatWallpaperDrawerProps = {
  open: boolean;
  wallpaper: WallpaperValue;
  setWallpaper: (value: WallpaperValue) => void;
  onClose: () => void;
};

export function ChatWallpaperDrawer({
  open,
  wallpaper,
  setWallpaper,
  onClose,
}: ChatWallpaperDrawerProps) {
  return (
    <>
      <div
        className={`absolute right-0 top-0 z-40 h-full w-72 flex-col border-l border-gray-200 bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? "flex translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <WallpaperPicker current={wallpaper} onChange={setWallpaper} onClose={onClose} />
      </div>
      {open && <div className="absolute inset-0 z-30 bg-black/20" onClick={onClose} />}
    </>
  );
}
