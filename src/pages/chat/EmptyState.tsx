import { MessageSquare } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-violet-50">
        <MessageSquare className="h-10 w-10 text-violet-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800">Start a conversation</h3>
      <p className="mt-1 max-w-xs text-sm text-gray-500">
        Select a contact from the list to begin chatting with your team members.
      </p>
    </div>
  );
}
