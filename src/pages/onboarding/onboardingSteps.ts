import { Building2, User, type LucideIcon } from "lucide-react";

export type OnboardingStepMeta = {
  number: number;
  label: string;
  icon: LucideIcon;
};

export const ONBOARDING_STEPS: OnboardingStepMeta[] = [
  { number: 1, label: "Profile", icon: User },
  { number: 2, label: "Organization", icon: Building2 },
];
