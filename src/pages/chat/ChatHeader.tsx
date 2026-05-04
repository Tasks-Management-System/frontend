import { ArrowLeft, Circle, Eraser, MoreVertical, Palette } from "lucide-react";
import type { RefObject } from "react";
import { Avatar } from "./Avatar";

type ChatHeaderProps = {
  menuButtonRef: RefObject<HTMLButtonElement | null>;
  menuRef: RefObject<HTMLDivElement | null>;
  selectedUserName: string;
  profileImage: string | null;
  isSelectedOnline: boolean;
  showTyping: boolean;
  menuOpen: boolean;
  setMenuOpen: (open: boolean | ((o: boolean) => boolean)) => void;
  onMobileBack: () => void;
  onWallpaperClick: () => void;
  onClearChatClick: () => void;
};

export function ChatHeader({
  menuButtonRef,
  menuRef,
  selectedUserName,
  profileImage,
  isSelectedOnline,
  showTyping,
  menuOpen,
  setMenuOpen,
  onMobileBack,
  onWallpaperClick,
  onClearChatClick,
}: ChatHeaderProps) {
  return (
    <div className="relative z-10 flex items-center gap-3 border-b border-gray-200/70 bg-white px-4 py-3 shadow-sm sm:px-6">
      <button
        type="button"
        onClick={onMobileBack}
        className="mr-1 rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 md:hidden"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <Avatar name={selectedUserName} image={profileImage} online={isSelectedOnline} size="md" />
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold text-gray-900">{selectedUserName}</h3>
        <div className="flex items-center gap-1.5">
          <Circle
            className={`h-2 w-2 ${
              isSelectedOnline ? "fill-emerald-500 text-emerald-500" : "fill-gray-300 text-gray-300"
            }`}
          />
          <span className="text-xs text-gray-500">
            {showTyping ? "Typing..." : isSelectedOnline ? "Online" : "Offline"}
          </span>
        </div>
      </div>

      <div className="relative shrink-0">
        <button
          ref={menuButtonRef}
          type="button"
          title="More options"
          onClick={() => setMenuOpen((o) => !o)}
          className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
            menuOpen
              ? "bg-gray-100 text-gray-700"
              : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          }`}
        >
          <MoreVertical className="h-4.5 w-4.5" />
        </button>

        {menuOpen && (
          <div
            ref={menuRef}
            className="absolute right-0 top-full z-50 mt-1.5 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl ring-1 ring-black/5"
          >
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onWallpaperClick();
              }}
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 transition hover:bg-violet-50 hover:text-violet-700"
            >
              <Palette className="h-4 w-4 text-gray-400" />
              <span>Wallpaper</span>
            </button>
            <div className="my-1 h-px bg-gray-100" />
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onClearChatClick();
              }}
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-500 transition hover:bg-red-50"
            >
              <Eraser className="h-4 w-4" />
              <span>Clear Chat</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
