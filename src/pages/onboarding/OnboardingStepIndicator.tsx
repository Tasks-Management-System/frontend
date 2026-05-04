import type { OnboardingStepMeta } from "./onboardingSteps";

type OnboardingStepIndicatorProps = {
  steps: readonly OnboardingStepMeta[];
  currentStep: number;
};

export function OnboardingStepIndicator({ steps, currentStep }: OnboardingStepIndicatorProps) {
  return (
    <div className="mb-8 flex items-center justify-center gap-4">
      {steps.map(({ number, label, icon: Icon }, idx) => {
        const isActive = currentStep === number;
        const isDone = currentStep > number;
        return (
          <div key={number} className="flex items-center gap-4">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${
                  isActive
                    ? "border-violet-600 bg-violet-600 text-white shadow-lg shadow-violet-200"
                    : isDone
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-slate-200 bg-white text-slate-400"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span
                className={`text-xs font-medium ${
                  isActive ? "text-violet-700" : isDone ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                {label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`mb-5 h-px w-12 transition-colors ${
                  currentStep > number ? "bg-emerald-400" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
