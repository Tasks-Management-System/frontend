import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import logo from "../../assets/Mainlogo.png";
import { getUserId } from "../../utils/session";
import { markOnboardingDone } from "./onboardingStorage";
import { ONBOARDING_STEPS } from "./onboardingSteps";
import { OnboardingStepIndicator } from "./OnboardingStepIndicator";
import { Step1Profile } from "./Step1Profile";
import { Step2Org } from "./Step2Org";

export default function OnboardingPage() {
  const userId = getUserId();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  if (!userId) return <Navigate to="/login" replace />;

  const finish = () => {
    markOnboardingDone(userId);
    navigate("/", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <img src={logo} alt="TMS" className="h-12 w-auto object-contain" />
          <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
            Welcome — let's get you set up
          </p>
        </div>

        <OnboardingStepIndicator steps={ONBOARDING_STEPS} currentStep={step} />

        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-xl shadow-slate-100/60 backdrop-blur">
          {step === 1 && (
            <>
              <h2 className="mb-1 text-lg font-semibold text-slate-900">Complete your profile</h2>
              <p className="mb-6 text-sm text-slate-500">
                Fill in your basic details so your team can identify you.
              </p>
              <Step1Profile userId={userId} onDone={() => setStep(2)} />
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="mb-1 text-lg font-semibold text-slate-900">
                Create your organization
              </h2>
              <p className="mb-6 text-sm text-slate-500">
                Set up a workspace for your team. This step is optional.
              </p>
              <Step2Org onSkip={finish} onDone={finish} />
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Step {step} of {ONBOARDING_STEPS.length}
        </p>
      </div>
    </div>
  );
}
