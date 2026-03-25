"use client";

interface WizardProgressStep {
  id: string;
  label: string;
}

interface ProgressStepperProps {
  currentStep: number;
  steps: WizardProgressStep[];
  onStepSelect: (index: number) => void;
}

function getStepState(index: number, currentStep: number) {
  if (index < currentStep) {
    return "complete";
  }

  if (index === currentStep) {
    return "active";
  }

  return "upcoming";
}

export function MobileProgressBar({
  currentStep,
  steps,
}: Omit<ProgressStepperProps, "onStepSelect">) {
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="pointer-events-none sticky top-[76px] z-10 lg:hidden">
      <div className="admin-surface rounded-[22px] px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="admin-label text-[11px] font-semibold uppercase tracking-[0.16em]">
              Progreso
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-900">
              Paso {currentStep + 1} de {steps.length}: {steps[currentStep]?.label}
            </p>
          </div>
          <span className="rounded-full bg-[#fff7eb] px-3 py-1 text-xs font-semibold text-slate-700">
            {Math.round(progress)}%
          </span>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f2eadc]">
          <div
            className="h-full rounded-full bg-slate-900 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function DesktopStepper({
  currentStep,
  steps,
  onStepSelect,
}: ProgressStepperProps) {
  return (
    <div className="hidden lg:block">
      <div className="admin-surface rounded-[28px] p-5 xl:p-6">
        <div className="grid gap-3 xl:grid-cols-5">
          {steps.map((step, index) => {
            const state = getStepState(index, currentStep);

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onStepSelect(index)}
                className={`rounded-3xl border px-4 py-4 text-left transition ${
                  state === "active"
                    ? "border-[#c6a66b] bg-[#fffaf2] shadow-[0_10px_24px_rgba(198,166,107,0.12)]"
                    : state === "complete"
                      ? "border-[#d8ccb8] bg-[#fffdf8]"
                      : "border-[#eadfcb] bg-white hover:border-[#d7c8b0]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                      state === "active"
                        ? "bg-slate-900 text-white"
                        : state === "complete"
                          ? "bg-[#efe5d6] text-slate-900"
                          : "bg-[#f6f1e8] text-slate-500"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="admin-label text-[11px] font-semibold uppercase tracking-[0.16em]">
                      {state === "complete"
                        ? "Completado"
                        : state === "active"
                          ? "Actual"
                          : "Pendiente"}
                    </p>
                    <p className="mt-1 break-words text-sm font-semibold text-slate-900">
                      {step.label}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ProgressStepper(props: ProgressStepperProps) {
  return (
    <>
      <MobileProgressBar currentStep={props.currentStep} steps={props.steps} />
      <DesktopStepper {...props} />
    </>
  );
}
