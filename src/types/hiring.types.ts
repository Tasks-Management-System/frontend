export type HiringStage =
  | "applied"
  | "screening"
  | "interview_scheduled"
  | "offer"
  | "hired"
  | "rejected";

export type HiringStatus = "pending" | "shortlisted" | "rejected" | "hired";
export type InterviewResult = "pending" | "passed" | "failed";
export type FeedbackRecommendation = "proceed" | "hold" | "reject";

export interface Applicant {
  _id: string;
  name: string;
  email: string;
  phone: string;
  resume: string;
  currentSalary?: number;
  expectedSalary?: number;
  noticePeriod?: string;
  skills: string[];
  experience?: string;
  linkedInProfile?: string;
  gitHubLink?: string;
  portfolioLink?: string;
  status: HiringStatus;
  stage: HiringStage;
  note?: string;
  orgAdmin?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewFeedback {
  _id: string;
  interviewer: { _id: string; name: string; email: string };
  rating: number | null;
  notes: string;
  recommendation: FeedbackRecommendation;
  submittedAt: string | null;
}

export interface Interview {
  _id: string;
  applicant: Applicant | { _id: string; name: string; email: string; stage: HiringStage };
  orgAdmin: string;
  scheduledAt: string;
  interviewers: Array<{ _id: string; name: string; email: string }>;
  feedback: InterviewFeedback[];
  result: InterviewResult;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApplicantBody {
  name: string;
  email: string;
  phone: string;
  resume: File;
  currentSalary?: number;
  expectedSalary?: number;
  noticePeriod?: string;
  skills?: string;
  experience?: string;
  linkedInProfile?: string;
  gitHubLink?: string;
  portfolioLink?: string;
  note?: string;
}

export interface ScheduleInterviewBody {
  applicantId: string;
  scheduledAt: string;
  interviewers?: string[];
  notes?: string;
}

export interface SubmitFeedbackBody {
  rating?: number;
  notes?: string;
  recommendation?: FeedbackRecommendation;
}

export const STAGE_LABELS: Record<HiringStage, string> = {
  applied: "Applied",
  screening: "Screening",
  interview_scheduled: "Interview",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
};

export const STAGE_ORDER: HiringStage[] = [
  "applied",
  "screening",
  "interview_scheduled",
  "offer",
  "hired",
  "rejected",
];

export const STAGE_COLORS: Record<HiringStage, string> = {
  applied: "bg-slate-100 text-slate-700",
  screening: "bg-blue-100 text-blue-700",
  interview_scheduled: "bg-violet-100 text-violet-700",
  offer: "bg-amber-100 text-amber-700",
  hired: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};
