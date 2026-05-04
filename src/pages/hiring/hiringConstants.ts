import type { HiringStage } from "../../types/hiring.types";
import { STAGE_ORDER } from "../../types/hiring.types";

export const ALL_STAGES: Array<HiringStage | "all"> = ["all", ...STAGE_ORDER];

export const VISIBLE_PIPELINE_STAGES: HiringStage[] = [
  "applied",
  "screening",
  "interview_scheduled",
  "offer",
  "hired",
  "rejected",
];
