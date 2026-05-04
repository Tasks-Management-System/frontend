import { Eraser } from "lucide-react";

type ClearChatConfirmModalProps = {
  peerName?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ClearChatConfirmModal({
  peerName,
  onConfirm,
  onCancel,
}: ClearChatConfirmModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-xs overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center px-6 pt-6 pb-4 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <Eraser className="h-5 w-5 text-red-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">Clear chat?</h3>
          <p className="mt-1 text-sm text-gray-500">
            All messages will be removed from your view only.{" "}
            <span className="font-medium text-gray-700">{peerName}</span> will still see the
            conversation.
          </p>
        </div>
        <div className="flex flex-col gap-2 px-6 pb-6">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"
          >
            Clear Chat
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full rounded-xl py-2 text-sm text-gray-400 transition hover:text-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
