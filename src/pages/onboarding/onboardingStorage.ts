export function getOnboardingKey(userId: string) {
  return `crm_onboarded_${userId}`;
}

export function markOnboardingDone(userId: string) {
  localStorage.setItem(getOnboardingKey(userId), "1");
}

export function needsOnboarding(userId: string | null): boolean {
  if (!userId) return false;
  return !localStorage.getItem(getOnboardingKey(userId));
}
