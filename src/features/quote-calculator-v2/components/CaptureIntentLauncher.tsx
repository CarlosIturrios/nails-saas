"use client";

import type { ReactNode } from "react";
import { CalendarDays, CheckCircle2, FileText } from "lucide-react";

import type { CaptureIntentMode } from "@/src/features/quote-calculator-v2/lib/capture-flow";
import type { QuoteCalculatorTheme } from "@/src/features/quote-calculator-v2/components/QuoteCalculatorV2.shared";

interface CaptureIntentLauncherProps {
  theme: QuoteCalculatorTheme;
  intents: CaptureIntentMode[];
  selectedIntent: CaptureIntentMode | null;
  onSelectIntent: (intent: CaptureIntentMode) => void;
}

const INTENT_COPY: Record<
  CaptureIntentMode,
  {
    title: string;
    description: string;
    icon: ReactNode;
    accentClass: string;
  }
> = {
  paid: {
    title: "Cobrar ahora",
    description: "Para ventas rápidas, mostrador, walk-ins o servicios que ya vas a cerrar.",
    icon: <CheckCircle2 size={22} />,
    accentClass: "text-emerald-700",
  },
  appointment: {
    title: "Agendar",
    description: "Para citas, sesiones o trabajos que necesitan fecha y hora.",
    icon: <CalendarDays size={22} />,
    accentClass: "text-sky-700",
  },
  quote: {
    title: "Hacer cotización",
    description: "Para dejarle precio al cliente y retomarlo después sin cobrar todavía.",
    icon: <FileText size={22} />,
    accentClass: "text-amber-700",
  },
};

export function CaptureIntentLauncher({
  theme,
  intents,
  selectedIntent,
  onSelectIntent,
}: CaptureIntentLauncherProps) {
  return (
    <section
      className="admin-surface rounded-3xl p-5 sm:p-6 lg:p-8"
      style={{
        background: theme.surfaceBackground,
        borderColor: theme.surfaceBorder,
      }}
    >
      <p className="ops-kicker" style={{ color: theme.badgeText }}>
        Inicio rápido
      </p>
      <h2 className="mt-3 text-2xl font-semibold text-slate-950">
        ¿Qué quieres hacer ahorita?
      </h2>
      <p className="admin-muted mt-2 max-w-3xl text-sm leading-6 sm:text-base">
        Elige una sola acción y el resto de la pantalla se acomoda para ayudarte a terminarla en
        segundos.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {intents.map((intent) => {
          const copy = INTENT_COPY[intent];
          const active = selectedIntent === intent;

          return (
            <button
              key={intent}
              type="button"
              onClick={() => onSelectIntent(intent)}
              className="rounded-[28px] border p-5 text-left transition sm:p-6"
              style={{
                borderColor: active ? theme.optionActiveBorder : theme.optionInactiveBorder,
                background: active ? theme.optionActiveBackground : theme.optionInactiveBackground,
                boxShadow: active
                  ? "0 18px 40px rgba(15, 23, 42, 0.08)"
                  : "0 10px 24px rgba(15, 23, 42, 0.03)",
              }}
            >
              <div className="flex items-start gap-4">
                <span
                  className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ${copy.accentClass}`}
                >
                  {copy.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-lg font-semibold text-slate-950">{copy.title}</p>
                  <p className="admin-muted mt-2 text-sm leading-6">{copy.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
