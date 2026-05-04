type TypingIndicatorProps = {
  name: string;
  hasWallpaper?: boolean;
};

export function TypingIndicator({ name, hasWallpaper }: TypingIndicatorProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div
        className={`flex items-center gap-1 rounded-2xl px-4 py-3 shadow-sm ${
          hasWallpaper
            ? "bg-white/90 backdrop-blur-sm shadow-lg"
            : "border border-gray-100 bg-white"
        }`}
      >
        <div className="flex gap-1">
          <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
        </div>
      </div>
      <span className="text-xs text-gray-400">{name} is typing...</span>
    </div>
  );
}
