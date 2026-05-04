import { createPortal } from "react-dom";
import type { MutableRefObject } from "react";
import EmojiPicker from "../../components/chat/EmojiPicker";

type ReactionPickerPosition = {
  messageId: string;
  top: number;
  left: number;
};

type ChatReactionPickerPortalProps = {
  reactionPicker: ReactionPickerPosition | null;
  reactionPickerMessageRef: MutableRefObject<string | null>;
  onDismiss: () => void;
  onSelectEmoji: (emoji: string) => void;
};

export function ChatReactionPickerPortal({
  reactionPicker,
  reactionPickerMessageRef,
  onDismiss,
  onSelectEmoji,
}: ChatReactionPickerPortalProps) {
  if (!reactionPicker) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200]"
      role="presentation"
      onMouseDown={() => {
        reactionPickerMessageRef.current = null;
        onDismiss();
      }}
    >
      <div
        className="fixed z-[201]"
        style={{ top: reactionPicker.top, left: reactionPicker.left }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <EmojiPicker
          variant="dark"
          onSelect={(emoji) => {
            void onSelectEmoji(emoji);
          }}
        />
      </div>
    </div>,
    document.body
  );
}
