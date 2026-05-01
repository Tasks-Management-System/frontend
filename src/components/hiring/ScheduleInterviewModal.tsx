import { useState } from "react";
import toast from "react-hot-toast";
import Modal from "../UI/Model";
import Button from "../UI/Button";
import Input from "../UI/Input";
import { useScheduleInterview } from "../../apis/api/hiring";
import type { Applicant } from "../../types/hiring.types";
import { useUsers } from "../../apis/api/auth";

interface Props {
  open: boolean;
  onClose: () => void;
  applicant: Applicant;
}

export default function ScheduleInterviewModal({ open, onClose, applicant }: Props) {
  const [scheduledAt, setScheduledAt] = useState("");
  const [interviewers, setInterviewers] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const schedule = useScheduleInterview();
  const { data: users = [] } = useUsers();

  const toggleInterviewer = (id: string) => {
    setInterviewers((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledAt) {
      toast.error("Pick a date and time");
      return;
    }
    try {
      await schedule.mutateAsync({
        applicantId: applicant._id,
        scheduledAt,
        interviewers,
        notes,
      });
      toast.success("Interview scheduled");
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Schedule Interview" panelClassName="max-w-lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <p className="mb-3 text-sm text-slate-600">
            Scheduling interview for <span className="font-semibold">{applicant.name}</span>
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Date & Time</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Interviewers <span className="text-slate-400">(optional)</span>
          </label>
          <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
            {users.length === 0 && (
              <p className="px-3 py-2 text-xs text-slate-400">No team members found</p>
            )}
            {users.map((u) => (
              <label
                key={u._id}
                className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={interviewers.includes(u._id)}
                  onChange={() => toggleInterviewer(u._id)}
                  className="accent-violet-600"
                />
                <span className="text-sm text-slate-700">{u.name}</span>
                <span className="ml-auto text-xs text-slate-400">{u.email}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Notes <span className="text-slate-400">(optional)</span>
          </label>
          <Input
            type="textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Focus areas, instructions for interviewers…"
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={schedule.isPending}>
            {schedule.isPending ? "Scheduling…" : "Schedule"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
