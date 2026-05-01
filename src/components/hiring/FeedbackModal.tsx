import { useState } from "react";
import toast from "react-hot-toast";
import { Star } from "lucide-react";
import Modal from "../UI/Model";
import Button from "../UI/Button";
import Input from "../UI/Input";
import { useSubmitFeedback } from "../../apis/api/hiring";
import type { FeedbackRecommendation, Interview } from "../../types/hiring.types";

interface Props {
  open: boolean;
  onClose: () => void;
  interview: Interview;
}

const RECOMMENDATION_OPTIONS: { value: FeedbackRecommendation; label: string; color: string }[] = [
  { value: "proceed", label: "Proceed", color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  { value: "hold", label: "Hold", color: "bg-amber-100 text-amber-700 border-amber-300" },
  { value: "reject", label: "Reject", color: "bg-red-100 text-red-700 border-red-300" },
];

export default function FeedbackModal({ open, onClose, interview }: Props) {
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [recommendation, setRecommendation] = useState<FeedbackRecommendation>("hold");
  const submit = useSubmitFeedback();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submit.mutateAsync({
        id: interview._id,
        body: { rating: rating || undefined, notes, recommendation },
      });
      toast.success("Feedback submitted");
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const applicantName =
    typeof interview.applicant === "string"
      ? "Applicant"
      : interview.applicant.name;

  return (
    <Modal isOpen={open} onClose={onClose} title="Submit Feedback" panelClassName="max-w-lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <p className="text-sm text-slate-600">
          Interview feedback for <span className="font-semibold">{applicantName}</span>
        </p>

        {/* Star rating */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setRating(s === rating ? 0 : s)}
                className="focus:outline-none"
              >
                <Star
                  className={`h-7 w-7 transition-colors ${
                    s <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Recommendation */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Recommendation</label>
          <div className="flex gap-2">
            {RECOMMENDATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRecommendation(opt.value)}
                className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-all ${
                  recommendation === opt.value
                    ? opt.color + " border-current"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
          <Input
            type="textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Share your observations about the candidate…"
            rows={4}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={submit.isPending}>
            {submit.isPending ? "Submitting…" : "Submit feedback"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
