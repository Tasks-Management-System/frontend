import { Trash2 } from "lucide-react";

type DeleteMessageModalProps = {
  onDeleteEveryone: () => void;
  onDeleteForMe: () => void;
  onCancel: () => void;
};

export function DeleteMessageModal({
  onDeleteEveryone,
  onDeleteForMe,
  onCancel,
}: DeleteMessageModalProps) {
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
            <Trash2 className="h-5 w-5 text-red-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">Delete message?</h3>
          <p className="mt-1 text-sm text-gray-500">Choose who to delete this message for.</p>
        </div>

        <div className="flex flex-col gap-2 px-6 pb-6">
          <button
            type="button"
            onClick={onDeleteEveryone}
            className="w-full rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"
          >
            Delete for Everyone
          </button>
          <button
            type="button"
            onClick={onDeleteForMe}
            className="w-full rounded-xl bg-gray-100 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-200"
          >
            Delete for Me
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
