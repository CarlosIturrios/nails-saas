import type { OrganizationQuoteConfigView } from "@/src/features/quote-calculator-v2/lib/types";

export const CAPTURE_WORK_MODE_OPTIONS = {
  walk_in: {
    label: "Cobro al momento",
    description: "Atiendes y cobras en ese momento la mayor parte del tiempo.",
  },
  scheduled: {
    label: "Solo con cita",
    description: "Normalmente trabajas con fecha y hora apartada.",
  },
  hybrid: {
    label: "Ambos",
    description: "A veces atiendes al momento y a veces agendas.",
  },
} as const;

export type CaptureWorkMode = keyof typeof CAPTURE_WORK_MODE_OPTIONS;
export type CaptureIntentMode = "paid" | "appointment" | "quote";

export function normalizeCaptureWorkMode(value: unknown): CaptureWorkMode {
  return value === "walk_in" || value === "scheduled" ? value : "hybrid";
}

export function getCaptureWorkModeFromConfig(config: Pick<OrganizationQuoteConfigView, "ui">) {
  return normalizeCaptureWorkMode(config.ui.texts.captureWorkMode);
}

export function getDefaultCaptureIntent(params: {
  workMode: CaptureWorkMode;
  canSaveQuotes: boolean;
  canSaveOrders: boolean;
  canChargeOrders: boolean;
  canScheduleOrders: boolean;
  requestedIntent?: CaptureIntentMode | null;
}) {
  const { requestedIntent } = params;

  if (requestedIntent) {
    if (
      requestedIntent === "paid" &&
      (params.canChargeOrders || params.canSaveOrders)
    ) {
      return "paid" as const;
    }

    if (requestedIntent === "appointment" && params.canSaveOrders && params.canScheduleOrders) {
      return "appointment" as const;
    }

    if (requestedIntent === "quote" && params.canSaveQuotes) {
      return "quote" as const;
    }
  }

  if (params.workMode === "scheduled" && params.canSaveOrders && params.canScheduleOrders) {
    return "appointment" as const;
  }

  if (params.canChargeOrders || params.canSaveOrders) {
    return "paid" as const;
  }

  if (params.canSaveQuotes) {
    return "quote" as const;
  }

  return null;
}

export function getAvailableCaptureIntents(params: {
  canSaveQuotes: boolean;
  canSaveOrders: boolean;
  canChargeOrders: boolean;
  canScheduleOrders: boolean;
}) {
  return [
    params.canSaveOrders || params.canChargeOrders
      ? ("paid" as const)
      : null,
    params.canSaveOrders && params.canScheduleOrders
      ? ("appointment" as const)
      : null,
    params.canSaveQuotes ? ("quote" as const) : null,
  ].filter(Boolean) as CaptureIntentMode[];
}
