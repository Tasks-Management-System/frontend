import { MessageSquare } from "lucide-react";

type ConversationEmptyProps = {
  wallpaperIsCustom: boolean;
};

export function ConversationEmpty({ wallpaperIsCustom }: ConversationEmptyProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div
        className={`rounded-2xl p-6 ${wallpaperIsCustom ? "bg-white/70 shadow-lg backdrop-blur-md" : ""}`}
      >
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 mx-auto">
          <MessageSquare className="h-7 w-7 text-violet-500" />
        </div>
        <p className="text-sm font-semibold text-gray-700">No messages yet</p>
        <p className="mt-0.5 text-xs text-gray-500">Send a message to start the conversation</p>
      </div>
    </div>
  );
}
