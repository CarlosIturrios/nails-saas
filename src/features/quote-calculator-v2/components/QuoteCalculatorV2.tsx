"use client";

import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileText,
} from "lucide-react";
import {
  QuoteItemType,
  ServiceOrderFlowType,
  ServiceOrderItemType,
  ServiceOrderStatus,
} from "@prisma/client";
import { type RefObject, useEffect, useMemo, useRef, useState } from "react";

import { getApiErrorMessage } from "@/src/components/ui/apiFeedback";
import Toast from "@/src/components/ui/Toast";
import { downloadQuoteImage } from "@/src/components/ui/downloadQuoteImage";
import { CaptureCatalogSection } from "@/src/features/quote-calculator-v2/components/CaptureCatalogSection";
import { CaptureDetailsStep } from "@/src/features/quote-calculator-v2/components/CaptureDetailsStep";
import { CaptureExperienceHeader } from "@/src/features/quote-calculator-v2/components/CaptureExperienceHeader";
import { CaptureExtrasSection } from "@/src/features/quote-calculator-v2/components/CaptureExtrasSection";
import { CaptureIntentLauncher } from "@/src/features/quote-calculator-v2/components/CaptureIntentLauncher";
import { CaptureManualAdjustmentsSection } from "@/src/features/quote-calculator-v2/components/CaptureManualAdjustmentsSection";
import { CaptureMobileStickyBar } from "@/src/features/quote-calculator-v2/components/CaptureMobileStickyBar";
import { CaptureResultShortcut } from "@/src/features/quote-calculator-v2/components/CaptureResultShortcut";
import { CaptureSaveStep } from "@/src/features/quote-calculator-v2/components/CaptureSaveStep";
import { CaptureSummaryPanel } from "@/src/features/quote-calculator-v2/components/CaptureSummaryPanel";
import {
  type CaptureSaveIntentOption,
  type CaptureEditContext,
  type CapturePersistedItem,
  type CaptureSnapshotExtraRow,
  type CaptureSnapshotSelectedRow,
  type ClientSearchMatch,
  type ManualAdjustment,
  type QuoteCalculatorTheme,
  type SaveIntent,
} from "@/src/features/quote-calculator-v2/components/QuoteCalculatorV2.shared";
import {
  formatExtraUnits,
  getBillableExtraQuantity,
  getExtraCaptureMode,
  getExtraDisplayGroup,
  getExtraLiveAmount,
  getExtraUnitLabel,
} from "@/src/features/quote-calculator-v2/lib/extra-display";
import {
  getAvailableCaptureIntents,
  getCaptureWorkModeFromConfig,
  getDefaultCaptureIntent,
  type CaptureIntentMode,
} from "@/src/features/quote-calculator-v2/lib/capture-flow";
import { getEffectiveLogoUrl } from "@/src/features/quote-calculator-v2/lib/logo";
import { OrganizationQuoteConfigView } from "@/src/features/quote-calculator-v2/lib/types";
import type { IndustryPresentation } from "@/src/features/v2/presentation";
import { getV2OrderHref, getV2QuoteHref } from "@/src/features/v2/routing";
import {
  formatDate,
  serializeDateTimeForApi,
  toDatetimeLocalValue,
} from "@/src/lib/dates";

interface QuoteCalculatorV2Props {
  config: OrganizationQuoteConfigView;
  timeZone: string;
  organizationName: string;
  presentation?: IndustryPresentation;
  assignableUsers?: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
  canUseManualAdjustments?: boolean;
  canSaveQuotes?: boolean;
  canSaveOrders?: boolean;
  canChargeOrders?: boolean;
  canScheduleOrders?: boolean;
  demoMode?: boolean;
  initialContext?: {
    clientId?: string | null;
    customerName?: string;
    customerPhone?: string;
    intent?: SaveIntent;
  };
  initialEditContext?: CaptureEditContext | null;
}

function createTheme(
  theme: Omit<
    QuoteCalculatorTheme,
    | "ticketBackground"
    | "ticketBorder"
    | "ticketMutedBackground"
    | "ticketAccentBackground"
    | "ticketAccentText"
  > &
    Partial<
      Pick<
        QuoteCalculatorTheme,
        | "ticketBackground"
        | "ticketBorder"
        | "ticketMutedBackground"
        | "ticketAccentBackground"
        | "ticketAccentText"
      >
    >
): QuoteCalculatorTheme {
  return {
    ticketBackground: theme.summaryBackground,
    ticketBorder: theme.summaryBorder,
    ticketMutedBackground: theme.panelBackground,
    ticketAccentBackground: theme.badgeBackground,
    ticketAccentText: theme.accentText,
    ...theme,
  };
}

const MODERN_TEMPLATE_THEMES = {
  modern: createTheme({
    layoutVariant: "stacked",
    pageBackground: "linear-gradient(180deg, #fffdfa 0%, #fbf7ef 100%)",
    surfaceBackground: "rgba(255, 255, 255, 0.94)",
    surfaceBorder: "#eadfcb",
    panelBackground: "#fffdfa",
    panelBorder: "#eadfcb",
    badgeBackground: "#fffaf2",
    badgeBorder: "#ddd1bf",
    badgeText: "#6f6455",
    summaryBackground: "rgba(255, 255, 255, 0.96)",
    summaryBorder: "#eadfcb",
    optionActiveBackground: "#fffaf2",
    optionActiveBorder: "#c6a66b",
    optionInactiveBackground: "#ffffff",
    optionInactiveBorder: "#eadfcb",
    optionHoverBorder: "#d6c8b3",
    accentText: "#1f2937",
    primaryButton: "#1f2937",
    primaryButtonHover: "#111827",
  }),
  retail_express: createTheme({
    layoutVariant: "stacked",
    pageBackground: "linear-gradient(180deg, #f9fafb 0%, #eef2f7 100%)",
    surfaceBackground: "rgba(255, 255, 255, 0.97)",
    surfaceBorder: "#d7dee8",
    panelBackground: "#f8fafc",
    panelBorder: "#d7dee8",
    badgeBackground: "#edf3ff",
    badgeBorder: "#c7d7f5",
    badgeText: "#1d4f91",
    summaryBackground: "linear-gradient(180deg, #ffffff 0%, #f4f7fb 100%)",
    summaryBorder: "#d7dee8",
    optionActiveBackground: "#eef4ff",
    optionActiveBorder: "#3b82f6",
    optionInactiveBackground: "#ffffff",
    optionInactiveBorder: "#d7dee8",
    optionHoverBorder: "#93c5fd",
    accentText: "#0f172a",
    primaryButton: "#0f172a",
    primaryButtonHover: "#020617",
  }),
  quick_bites: createTheme({
    layoutVariant: "stacked",
    pageBackground: "linear-gradient(180deg, #fff8f1 0%, #ffe7d1 100%)",
    surfaceBackground: "rgba(255, 255, 255, 0.97)",
    surfaceBorder: "#f3c59d",
    panelBackground: "#fffaf5",
    panelBorder: "#f3c59d",
    badgeBackground: "#fff1e5",
    badgeBorder: "#f7c79d",
    badgeText: "#b45309",
    summaryBackground: "linear-gradient(180deg, #fff9f3 0%, #ffffff 100%)",
    summaryBorder: "#f3c59d",
    optionActiveBackground: "#fff1e5",
    optionActiveBorder: "#ea580c",
    optionInactiveBackground: "#ffffff",
    optionInactiveBorder: "#f3c59d",
    optionHoverBorder: "#fb923c",
    accentText: "#9a3412",
    primaryButton: "#b93818",
    primaryButtonHover: "#9f2f13",
  }),
  social_cards: createTheme({
    layoutVariant: "stacked",
    pageBackground: "linear-gradient(180deg, #f5fbff 0%, #ebf4ff 100%)",
    surfaceBackground: "rgba(255, 255, 255, 0.97)",
    surfaceBorder: "#c7daee",
    panelBackground: "#f8fbff",
    panelBorder: "#c7daee",
    badgeBackground: "#e9f3ff",
    badgeBorder: "#c7daee",
    badgeText: "#1e3a8a",
    summaryBackground: "linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)",
    summaryBorder: "#c7daee",
    optionActiveBackground: "#ebf4ff",
    optionActiveBorder: "#2563eb",
    optionInactiveBackground: "#ffffff",
    optionInactiveBorder: "#c7daee",
    optionHoverBorder: "#60a5fa",
    accentText: "#1d4ed8",
    primaryButton: "#2563eb",
    primaryButtonHover: "#1d4ed8",
  }),
  ticket_board: createTheme({
    layoutVariant: "stacked",
    pageBackground: "linear-gradient(180deg, #f7f7f6 0%, #eaecf0 100%)",
    surfaceBackground: "rgba(255, 255, 255, 0.97)",
    surfaceBorder: "#cfd4dc",
    panelBackground: "#f8fafc",
    panelBorder: "#cfd4dc",
    badgeBackground: "#eef2f7",
    badgeBorder: "#cfd4dc",
    badgeText: "#334155",
    summaryBackground: "linear-gradient(180deg, #ffffff 0%, #f4f6f8 100%)",
    summaryBorder: "#cfd4dc",
    optionActiveBackground: "#e2e8f0",
    optionActiveBorder: "#475569",
    optionInactiveBackground: "#ffffff",
    optionInactiveBorder: "#cfd4dc",
    optionHoverBorder: "#94a3b8",
    accentText: "#1e293b",
    primaryButton: "#1e293b",
    primaryButtonHover: "#0f172a",
  }),
  beauty_soft: createTheme({
    layoutVariant: "stacked",
    pageBackground: "linear-gradient(180deg, #fffafc 0%, #fff3f8 100%)",
    surfaceBackground: "rgba(255, 255, 255, 0.96)",
    surfaceBorder: "#efd1df",
    panelBackground: "#fff8fb",
    panelBorder: "#efd1df",
    badgeBackground: "#fff1f7",
    badgeBorder: "#e7bfd2",
    badgeText: "#8a4d6d",
    summaryBackground: "linear-gradient(180deg, #fffafc 0%, #fff4f8 100%)",
    summaryBorder: "#efd1df",
    optionActiveBackground: "#fff1f7",
    optionActiveBorder: "#d68bad",
    optionInactiveBackground: "#ffffff",
    optionInactiveBorder: "#efd1df",
    optionHoverBorder: "#e0a8c1",
    accentText: "#8a4d6d",
    primaryButton: "#9d4c73",
    primaryButtonHover: "#8a3f63",
  }),
  barber_classic: createTheme({
    layoutVariant: "stacked",
    pageBackground: "linear-gradient(180deg, #fafaf9 0%, #f5f5f4 100%)",
    surfaceBackground: "rgba(255, 255, 255, 0.96)",
    surfaceBorder: "#d6d3d1",
    panelBackground: "#fcfbfa",
    panelBorder: "#d6d3d1",
    badgeBackground: "#f5f5f4",
    badgeBorder: "#d6d3d1",
    badgeText: "#44403c",
    summaryBackground: "linear-gradient(180deg, #ffffff 0%, #f5f5f4 100%)",
    summaryBorder: "#d6d3d1",
    optionActiveBackground: "#f5f5f4",
    optionActiveBorder: "#78716c",
    optionInactiveBackground: "#ffffff",
    optionInactiveBorder: "#d6d3d1",
    optionHoverBorder: "#a8a29e",
    accentText: "#292524",
    primaryButton: "#44403c",
    primaryButtonHover: "#292524",
  }),
  wellness_calm: createTheme({
    layoutVariant: "stacked",
    pageBackground: "linear-gradient(180deg, #f8fafc 0%, #f5f3ff 100%)",
    surfaceBackground: "rgba(255, 255, 255, 0.95)",
    surfaceBorder: "#ddd6fe",
    panelBackground: "#faf7ff",
    panelBorder: "#ddd6fe",
    badgeBackground: "#f3f0ff",
    badgeBorder: "#d8ccff",
    badgeText: "#6b5b95",
    summaryBackground: "linear-gradient(180deg, #faf7ff 0%, #ffffff 100%)",
    summaryBorder: "#ddd6fe",
    optionActiveBackground: "#f3f0ff",
    optionActiveBorder: "#b8a6f2",
    optionInactiveBackground: "#ffffff",
    optionInactiveBorder: "#ddd6fe",
    optionHoverBorder: "#c4b5fd",
    accentText: "#5b4b8a",
    primaryButton: "#6b5b95",
    primaryButtonHover: "#58497c",
  }),
  clinical_clean: createTheme({
    layoutVariant: "stacked",
    pageBackground: "linear-gradient(180deg, #f7fffd 0%, #ecfeff 100%)",
    surfaceBackground: "rgba(255, 255, 255, 0.96)",
    surfaceBorder: "#bfe7e2",
    panelBackground: "#f7fffd",
    panelBorder: "#bfe7e2",
    badgeBackground: "#effcf9",
    badgeBorder: "#bfe7e2",
    badgeText: "#0f766e",
    summaryBackground: "linear-gradient(180deg, #f7fffd 0%, #ffffff 100%)",
    summaryBorder: "#bfe7e2",
    optionActiveBackground: "#effcf9",
    optionActiveBorder: "#59c5b7",
    optionInactiveBackground: "#ffffff",
    optionInactiveBorder: "#bfe7e2",
    optionHoverBorder: "#7dd3c7",
    accentText: "#0f766e",
    primaryButton: "#0f766e",
    primaryButtonHover: "#115e59",
  }),
  pos_classic: createTheme({
    layoutVariant: "pos_classic",
    pageBackground: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
    surfaceBackground: "rgba(255, 255, 255, 0.98)",
    surfaceBorder: "#d5deec",
    panelBackground: "#f8fbff",
    panelBorder: "#d5deec",
    badgeBackground: "#ecf3ff",
    badgeBorder: "#c8d8f2",
    badgeText: "#1e40af",
    summaryBackground: "linear-gradient(180deg, #ffffff 0%, #f6f9ff 100%)",
    summaryBorder: "#c8d8f2",
    optionActiveBackground: "#eaf2ff",
    optionActiveBorder: "#2563eb",
    optionInactiveBackground: "#ffffff",
    optionInactiveBorder: "#d5deec",
    optionHoverBorder: "#93c5fd",
    accentText: "#0f172a",
    primaryButton: "#0f172a",
    primaryButtonHover: "#020617",
    ticketBackground: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
    ticketBorder: "#bfd3f1",
    ticketMutedBackground: "#f3f7fd",
    ticketAccentBackground: "#dbeafe",
    ticketAccentText: "#1d4ed8",
  }),
  pos_compact: createTheme({
    layoutVariant: "pos_compact",
    pageBackground: "linear-gradient(180deg, #f8fafc 0%, #e9eef5 100%)",
    surfaceBackground: "rgba(255, 255, 255, 0.98)",
    surfaceBorder: "#d4dae3",
    panelBackground: "#f8fafc",
    panelBorder: "#d4dae3",
    badgeBackground: "#edf1f7",
    badgeBorder: "#c6cfdb",
    badgeText: "#334155",
    summaryBackground: "linear-gradient(180deg, #ffffff 0%, #f4f7fb 100%)",
    summaryBorder: "#c6cfdb",
    optionActiveBackground: "#e6edf7",
    optionActiveBorder: "#475569",
    optionInactiveBackground: "#ffffff",
    optionInactiveBorder: "#d4dae3",
    optionHoverBorder: "#94a3b8",
    accentText: "#0f172a",
    primaryButton: "#111827",
    primaryButtonHover: "#030712",
    ticketBackground: "linear-gradient(180deg, #ffffff 0%, #f5f7fb 100%)",
    ticketBorder: "#c6cfdb",
    ticketMutedBackground: "#eef2f7",
    ticketAccentBackground: "#e2e8f0",
    ticketAccentText: "#334155",
  }),
  pos_touch: createTheme({
    layoutVariant: "pos_touch",
    pageBackground: "linear-gradient(180deg, #fff9f1 0%, #ffe8d4 100%)",
    surfaceBackground: "rgba(255, 255, 255, 0.98)",
    surfaceBorder: "#efc8a7",
    panelBackground: "#fffaf4",
    panelBorder: "#efc8a7",
    badgeBackground: "#fff2e5",
    badgeBorder: "#f7cc9f",
    badgeText: "#b45309",
    summaryBackground: "linear-gradient(180deg, #fffaf4 0%, #ffffff 100%)",
    summaryBorder: "#f1c79b",
    optionActiveBackground: "#fff0e0",
    optionActiveBorder: "#ea580c",
    optionInactiveBackground: "#ffffff",
    optionInactiveBorder: "#efc8a7",
    optionHoverBorder: "#fb923c",
    accentText: "#9a3412",
    primaryButton: "#c2410c",
    primaryButtonHover: "#9a3412",
    ticketBackground: "linear-gradient(180deg, #ffffff 0%, #fff8ef 100%)",
    ticketBorder: "#efc8a7",
    ticketMutedBackground: "#fff3e5",
    ticketAccentBackground: "#ffedd5",
    ticketAccentText: "#c2410c",
  }),
  workshop_pro: createTheme({
    layoutVariant: "stacked",
    pageBackground: "linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
    surfaceBackground: "rgba(255, 255, 255, 0.96)",
    surfaceBorder: "#cbd5e1",
    panelBackground: "#f8fafc",
    panelBorder: "#cbd5e1",
    badgeBackground: "#eef2f7",
    badgeBorder: "#cbd5e1",
    badgeText: "#334155",
    summaryBackground: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
    summaryBorder: "#cbd5e1",
    optionActiveBackground: "#e2e8f0",
    optionActiveBorder: "#64748b",
    optionInactiveBackground: "#ffffff",
    optionInactiveBorder: "#cbd5e1",
    optionHoverBorder: "#94a3b8",
    accentText: "#334155",
    primaryButton: "#334155",
    primaryButtonHover: "#1e293b",
  }),
  carwash_fresh: createTheme({
    layoutVariant: "stacked",
    pageBackground: "linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 100%)",
    surfaceBackground: "rgba(255, 255, 255, 0.96)",
    surfaceBorder: "#bae6fd",
    panelBackground: "#f0f9ff",
    panelBorder: "#bae6fd",
    badgeBackground: "#e0f2fe",
    badgeBorder: "#bae6fd",
    badgeText: "#0369a1",
    summaryBackground: "linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%)",
    summaryBorder: "#bae6fd",
    optionActiveBackground: "#e0f2fe",
    optionActiveBorder: "#38bdf8",
    optionInactiveBackground: "#ffffff",
    optionInactiveBorder: "#bae6fd",
    optionHoverBorder: "#7dd3fc",
    accentText: "#0369a1",
    primaryButton: "#0284c7",
    primaryButtonHover: "#0369a1",
  }),
  craft_warm: createTheme({
    layoutVariant: "stacked",
    pageBackground: "linear-gradient(180deg, #fffbeb 0%, #fef3c7 100%)",
    surfaceBackground: "rgba(255, 255, 255, 0.95)",
    surfaceBorder: "#e7d2ad",
    panelBackground: "#fffaf0",
    panelBorder: "#e7d2ad",
    badgeBackground: "#fff4da",
    badgeBorder: "#e7d2ad",
    badgeText: "#92400e",
    summaryBackground: "linear-gradient(180deg, #fffaf0 0%, #ffffff 100%)",
    summaryBorder: "#e7d2ad",
    optionActiveBackground: "#fff1cc",
    optionActiveBorder: "#d4a373",
    optionInactiveBackground: "#ffffff",
    optionInactiveBorder: "#e7d2ad",
    optionHoverBorder: "#d6b98c",
    accentText: "#92400e",
    primaryButton: "#92400e",
    primaryButtonHover: "#78350f",
  }),
  electrician_bold: createTheme({
    layoutVariant: "stacked",
    pageBackground: "linear-gradient(180deg, #fffbeb 0%, #fef9c3 100%)",
    surfaceBackground: "rgba(255, 255, 255, 0.96)",
    surfaceBorder: "#f7d873",
    panelBackground: "#fffdf2",
    panelBorder: "#f7d873",
    badgeBackground: "#fff7cc",
    badgeBorder: "#f7d873",
    badgeText: "#a16207",
    summaryBackground: "linear-gradient(180deg, #fffdf2 0%, #ffffff 100%)",
    summaryBorder: "#f7d873",
    optionActiveBackground: "#fff5b7",
    optionActiveBorder: "#eab308",
    optionInactiveBackground: "#ffffff",
    optionInactiveBorder: "#f7d873",
    optionHoverBorder: "#facc15",
    accentText: "#a16207",
    primaryButton: "#ca8a04",
    primaryButtonHover: "#a16207",
  }),
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeDraftMoney(value: unknown) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return 0;
  }

  return Math.max(0, Math.round(amount));
}

function normalizeDraftQuantity(value: unknown) {
  const quantity = Number(value);

  if (!Number.isFinite(quantity)) {
    return 0;
  }

  return Math.max(0, Math.round(quantity));
}

function parseSnapshotSelectedRows(
  snapshot: Record<string, unknown> | null | undefined
): CaptureSnapshotSelectedRow[] {
  const rows = snapshot?.selectedRows;

  if (!Array.isArray(rows)) {
    return [];
  }

  const parsedRows: CaptureSnapshotSelectedRow[] = [];

  for (const row of rows) {
    if (!isRecord(row)) {
      continue;
    }

    const label = typeof row.label === "string" ? row.label.trim() : "";

    if (!label) {
      continue;
    }

    parsedRows.push({
      id: typeof row.id === "string" ? row.id : undefined,
      categoryId: typeof row.categoryId === "string" ? row.categoryId : undefined,
      optionId: typeof row.optionId === "string" ? row.optionId : undefined,
      label,
      amount: normalizeDraftMoney(row.amount),
    });
  }

  return parsedRows;
}

function parseSnapshotExtraRows(
  snapshot: Record<string, unknown> | null | undefined
): CaptureSnapshotExtraRow[] {
  const rows = snapshot?.extraRows;

  if (!Array.isArray(rows)) {
    return [];
  }

  return rows
    .map((row) => {
      if (!isRecord(row) || typeof row.id !== "string") {
        return null;
      }

      const label = typeof row.label === "string" ? row.label.trim() : "";

      if (!label) {
        return null;
      }

      return {
        id: row.id,
        label,
        amount: normalizeDraftMoney(row.amount),
        pricingType: row.pricingType === "PER_UNIT" ? "PER_UNIT" : "FIXED",
        quantity: normalizeDraftQuantity(row.quantity),
        billableQuantity: normalizeDraftQuantity(row.billableQuantity),
        includedQuantity: normalizeDraftQuantity(row.includedQuantity),
        captureMode: row.captureMode === "individual" ? "individual" : "standard",
        displayGroup:
          row.displayGroup === "tones" || row.displayGroup === "decorations"
            ? row.displayGroup
            : "general",
        unitLabel:
          typeof row.unitLabel === "string" && row.unitLabel.trim()
            ? row.unitLabel.trim()
            : "unidad",
      };
    })
    .filter((row): row is CaptureSnapshotExtraRow => Boolean(row));
}

function parseSnapshotManualAdjustments(
  snapshot: Record<string, unknown> | null | undefined
) {
  const rows = snapshot?.manualAdjustments;

  if (!Array.isArray(rows)) {
    return [];
  }

  return rows
    .map((row) => {
      if (!isRecord(row)) {
        return null;
      }

      const label = typeof row.label === "string" ? row.label.trim() : "";
      const amount = normalizeDraftMoney(row.amount);

      if (!label || amount <= 0) {
        return null;
      }

      return {
        id:
          typeof row.id === "string" && row.id.trim()
            ? row.id
            : `restored-manual-${label}-${amount}`,
        label,
        amount,
      };
    })
    .filter((row): row is ManualAdjustment => Boolean(row));
}

function normalizeServiceLookupValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function shouldAttemptServiceRecovery(
  label: string,
  metadata?: Record<string, unknown> | null
) {
  const normalizedMetadata = isRecord(metadata) ? metadata : null;

  return (
    label.includes(" · ") ||
    typeof normalizedMetadata?.categoryId === "string" ||
    typeof normalizedMetadata?.optionId === "string"
  );
}

function findUniqueServiceMatch(
  config: OrganizationQuoteConfigView,
  predicate: (
    category: OrganizationQuoteConfigView["categories"][number],
    option: OrganizationQuoteConfigView["categories"][number]["options"][number]
  ) => boolean
) {
  let matched:
    | {
        category: OrganizationQuoteConfigView["categories"][number];
        option: OrganizationQuoteConfigView["categories"][number]["options"][number];
      }
    | null = null;

  for (const category of config.categories) {
    for (const option of category.options) {
      if (!predicate(category, option)) {
        continue;
      }

      if (matched) {
        return null;
      }

      matched = { category, option };
    }
  }

  return matched;
}

function resolveCurrentServiceMatch(
  config: OrganizationQuoteConfigView,
  candidate: {
    categoryId?: string | null;
    optionId?: string | null;
    label: string;
    amount: number;
    metadata?: Record<string, unknown> | null;
  }
) {
  const normalizedAmount = normalizeDraftMoney(candidate.amount);
  const normalizedLabel = normalizeServiceLookupValue(candidate.label);
  const metadata = isRecord(candidate.metadata) ? candidate.metadata : null;
  const candidateIds = [
    {
      categoryId: candidate.categoryId ?? undefined,
      optionId: candidate.optionId ?? undefined,
    },
    {
      categoryId: typeof metadata?.categoryId === "string" ? metadata.categoryId : undefined,
      optionId: typeof metadata?.optionId === "string" ? metadata.optionId : undefined,
    },
  ];

  for (const pair of candidateIds) {
    if (!pair.categoryId || !pair.optionId) {
      continue;
    }

    const category = config.categories.find((item) => item.id === pair.categoryId);
    const option = category?.options.find((item) => item.id === pair.optionId);

    if (category && option && option.price === normalizedAmount) {
      return { category, option };
    }
  }

  if (!normalizedLabel || normalizedAmount <= 0) {
    return null;
  }

  const exactLabelMatch = findUniqueServiceMatch(
    config,
    (category, option) =>
      option.price === normalizedAmount &&
      normalizeServiceLookupValue(`${category.name} · ${option.name}`) === normalizedLabel
  );

  if (exactLabelMatch) {
    return exactLabelMatch;
  }

  const compactLabelMatch = findUniqueServiceMatch(
    config,
    (category, option) =>
      option.price === normalizedAmount &&
      normalizeServiceLookupValue(`${category.name} ${option.name}`) === normalizedLabel
  );

  if (compactLabelMatch) {
    return compactLabelMatch;
  }

  return findUniqueServiceMatch(
    config,
    (_category, option) =>
      option.price === normalizedAmount &&
      normalizeServiceLookupValue(option.name) === normalizedLabel
  );
}

function normalizeExtraPricingType(value: unknown) {
  if (value === "FIXED" || value === "PER_UNIT") {
    return value;
  }

  return null;
}

function extractNormalizedExtraLabels(
  label: string,
  metadata?: Record<string, unknown> | null
) {
  const normalizedMetadata = isRecord(metadata) ? metadata : null;
  const candidates = new Set<string>();
  const trimmedLabel = label.trim();
  const strippedLabel = trimmedLabel.replace(/\s*\([^)]*\)\s*$/, "").trim();
  const metadataName =
    typeof normalizedMetadata?.extraName === "string"
      ? normalizedMetadata.extraName.trim()
      : typeof normalizedMetadata?.name === "string"
        ? normalizedMetadata.name.trim()
        : "";

  [trimmedLabel, strippedLabel, metadataName].forEach((value) => {
    const normalized = normalizeServiceLookupValue(value);

    if (normalized) {
      candidates.add(normalized);
    }
  });

  return candidates;
}

function buildExtraRequestedQuantityCandidates(
  extra: OrganizationQuoteConfigView["extras"][number],
  candidate: {
    amount: number;
    quantity?: number | null;
    billableQuantity?: number | null;
    includedQuantity?: number | null;
    requestedQuantity?: number | null;
  }
) {
  if (extra.pricingType === "FIXED") {
    return normalizeDraftMoney(candidate.amount) > 0 ? [1] : [];
  }

  const amount = normalizeDraftMoney(candidate.amount);
  const requestedQuantity = normalizeDraftQuantity(candidate.requestedQuantity);
  const quantity = normalizeDraftQuantity(candidate.quantity);
  const billableQuantity = normalizeDraftQuantity(candidate.billableQuantity);
  const includedQuantity = normalizeDraftQuantity(candidate.includedQuantity);
  const amountBasedBillableQuantity =
    extra.price > 0 && amount > 0 && amount % extra.price === 0 ? amount / extra.price : 0;
  const candidates = [
    requestedQuantity,
    quantity,
    billableQuantity > 0 || includedQuantity > 0 ? billableQuantity + includedQuantity : 0,
    quantity > 0 || includedQuantity > 0 ? quantity + includedQuantity : 0,
    amountBasedBillableQuantity > 0 || includedQuantity > 0
      ? amountBasedBillableQuantity + includedQuantity
      : 0,
    amountBasedBillableQuantity,
  ];

  return Array.from(new Set(candidates.filter((value) => value > 0)));
}

function resolveCurrentExtraMatch(
  config: OrganizationQuoteConfigView,
  candidate: {
    id?: string | null;
    label: string;
    amount: number;
    pricingType?: "FIXED" | "PER_UNIT" | null;
    quantity?: number | null;
    billableQuantity?: number | null;
    includedQuantity?: number | null;
    requestedQuantity?: number | null;
    metadata?: Record<string, unknown> | null;
  }
) {
  const normalizedAmount = normalizeDraftMoney(candidate.amount);
  const metadata = isRecord(candidate.metadata) ? candidate.metadata : null;
  const expectedPricingType =
    normalizeExtraPricingType(candidate.pricingType) ??
    normalizeExtraPricingType(metadata?.pricingType);
  const requestedQuantityCandidatesFor = (
    extra: OrganizationQuoteConfigView["extras"][number]
  ) => buildExtraRequestedQuantityCandidates(extra, candidate);

  function tryMatch(extra: OrganizationQuoteConfigView["extras"][number]) {
    if (expectedPricingType && extra.pricingType !== expectedPricingType) {
      return null;
    }

    for (const requestedQuantity of requestedQuantityCandidatesFor(extra)) {
      if (
        getExtraLiveAmount(
          extra.pricingType,
          requestedQuantity,
          extra.includedQuantity,
          extra.price
        ) === normalizedAmount
      ) {
        return { extra, requestedQuantity };
      }
    }

    return null;
  }

  const candidateIds = [
    candidate.id,
    typeof metadata?.extraId === "string" ? metadata.extraId : null,
    typeof metadata?.id === "string" ? metadata.id : null,
  ].filter((value): value is string => Boolean(value?.trim()));

  for (const extraId of candidateIds) {
    const extra = config.extras.find((item) => item.id === extraId);
    const match = extra ? tryMatch(extra) : null;

    if (match) {
      return match;
    }
  }

  const normalizedLabels = extractNormalizedExtraLabels(candidate.label, metadata);

  if (normalizedLabels.size === 0 || normalizedAmount <= 0) {
    return null;
  }

  const matches = config.extras
    .filter((extra) => normalizedLabels.has(normalizeServiceLookupValue(extra.name)))
    .map((extra) => tryMatch(extra))
    .filter((match): match is NonNullable<typeof match> => Boolean(match));

  if (matches.length === 1) {
    return matches[0];
  }

  return null;
}

function buildInitialDraftState(
  config: OrganizationQuoteConfigView,
  initialEditContext: CaptureEditContext | null | undefined
) {
  const selectedOptions: Record<string, string[]> = {};
  const extraQuantities: Record<string, number> = {};
  const manualAdjustments: ManualAdjustment[] = [];

  if (!initialEditContext) {
    return {
      selectedOptions,
      extraQuantities,
      manualAdjustments,
    };
  }

  const persistedItems = initialEditContext.items;
  const matchedPersistedItems = new Set<number>();
  let manualIndex = 0;

  function pushManualAdjustment(label: string, amount: number) {
    const normalizedLabel = label.trim();
    const normalizedAmount = normalizeDraftMoney(amount);

    if (!normalizedLabel || normalizedAmount <= 0) {
      return;
    }

    manualAdjustments.push({
      id: `restored-manual-${manualIndex}`,
      label: normalizedLabel,
      amount: normalizedAmount,
    });
    manualIndex += 1;
  }

  function markPersistedItemAsMatched(
    itemType: CapturePersistedItem["itemType"],
    label: string,
    total: number
  ) {
    const normalizedLabel = label.trim();
    const normalizedTotal = normalizeDraftMoney(total);
    const matchedIndex = persistedItems.findIndex(
      (item, index) =>
        !matchedPersistedItems.has(index) &&
        item.itemType === itemType &&
        item.label.trim() === normalizedLabel &&
        normalizeDraftMoney(item.total) === normalizedTotal
    );

    if (matchedIndex >= 0) {
      matchedPersistedItems.add(matchedIndex);
    }
  }

  function applyServiceSelection(
    category: OrganizationQuoteConfigView["categories"][number],
    option: OrganizationQuoteConfigView["categories"][number]["options"][number]
  ) {
    const currentSelection = selectedOptions[category.id] ?? [];

    selectedOptions[category.id] = category.multiSelect
      ? Array.from(new Set([...currentSelection, option.id]))
      : [option.id];
  }

  function applyExtraQuantity(
    extra: OrganizationQuoteConfigView["extras"][number],
    requestedQuantity: number
  ) {
    if (requestedQuantity <= 0) {
      return;
    }

    extraQuantities[extra.id] = Math.max(extraQuantities[extra.id] ?? 0, requestedQuantity);
  }

  for (const row of parseSnapshotSelectedRows(initialEditContext.snapshot)) {
    const serviceMatch = resolveCurrentServiceMatch(config, {
      categoryId: row.categoryId ?? null,
      optionId: row.optionId ?? null,
      label: row.label,
      amount: row.amount,
    });

    if (serviceMatch) {
      applyServiceSelection(serviceMatch.category, serviceMatch.option);
    } else {
      pushManualAdjustment(row.label, row.amount);
    }

    markPersistedItemAsMatched("SERVICE", row.label, row.amount);
  }

  for (const row of parseSnapshotExtraRows(initialEditContext.snapshot)) {
    const extraMatch = resolveCurrentExtraMatch(config, {
      id: row.id,
      label: row.label,
      amount: row.amount,
      pricingType: row.pricingType,
      quantity: row.quantity,
      billableQuantity: row.billableQuantity,
      includedQuantity: row.includedQuantity,
    });

    if (extraMatch) {
      applyExtraQuantity(extraMatch.extra, extraMatch.requestedQuantity);
    } else {
      pushManualAdjustment(row.label, row.amount);
    }

    markPersistedItemAsMatched("EXTRA", row.label, row.amount);
  }

  for (const row of parseSnapshotManualAdjustments(initialEditContext.snapshot)) {
    const serviceMatch = shouldAttemptServiceRecovery(row.label)
      ? resolveCurrentServiceMatch(config, {
          label: row.label,
          amount: row.amount,
        })
      : null;

    if (serviceMatch) {
      applyServiceSelection(serviceMatch.category, serviceMatch.option);
    } else {
      pushManualAdjustment(row.label, row.amount);
    }

    markPersistedItemAsMatched("ADJUSTMENT", row.label, row.amount);
  }

  persistedItems.forEach((item, index) => {
    if (matchedPersistedItems.has(index)) {
      return;
    }

    if (item.itemType === "SERVICE") {
      const serviceMatch = resolveCurrentServiceMatch(config, {
        label: item.label,
        amount: item.total,
        metadata: item.metadata,
      });

      if (serviceMatch) {
        applyServiceSelection(serviceMatch.category, serviceMatch.option);
        matchedPersistedItems.add(index);
        return;
      }
    }

    if (item.itemType === "EXTRA") {
      const extraMetadata = isRecord(item.metadata) ? item.metadata : null;
      const extraMatch = resolveCurrentExtraMatch(config, {
        label: item.label,
        amount: item.total,
        pricingType: normalizeExtraPricingType(extraMetadata?.pricingType),
        quantity: item.quantity,
        requestedQuantity:
          typeof extraMetadata?.requestedQuantity === "number"
            ? extraMetadata.requestedQuantity
            : null,
        billableQuantity:
          typeof extraMetadata?.billableQuantity === "number"
            ? extraMetadata.billableQuantity
            : null,
        includedQuantity:
          typeof extraMetadata?.includedQuantity === "number"
            ? extraMetadata.includedQuantity
            : null,
        metadata: extraMetadata,
      });

      if (extraMatch) {
        applyExtraQuantity(extraMatch.extra, extraMatch.requestedQuantity);
        matchedPersistedItems.add(index);
        return;
      }
    }

    if (
      item.itemType === "ADJUSTMENT" &&
      shouldAttemptServiceRecovery(item.label, item.metadata)
    ) {
      const serviceMatch = resolveCurrentServiceMatch(config, {
        label: item.label,
        amount: item.total,
        metadata: item.metadata,
      });

      if (serviceMatch) {
        applyServiceSelection(serviceMatch.category, serviceMatch.option);
        matchedPersistedItems.add(index);
        return;
      }
    }

    pushManualAdjustment(item.label, item.total);
  });

  return {
    selectedOptions,
    extraQuantities,
    manualAdjustments,
  };
}

export function QuoteCalculatorV2({
  config,
  timeZone,
  organizationName,
  presentation,
  assignableUsers = [],
  canUseManualAdjustments = false,
  canSaveQuotes = true,
  canSaveOrders = true,
  canChargeOrders = true,
  canScheduleOrders = true,
  demoMode = false,
  initialContext,
  initialEditContext,
}: QuoteCalculatorV2Props) {
  const effectiveLogoUrl = getEffectiveLogoUrl({
    businessType: config.branding.businessType,
    logoUrl: config.branding.logoUrl,
  });
  const isLegacyTemplate = config.branding.quoteTemplate === "legacy_gica";
  const modernTheme =
    MODERN_TEMPLATE_THEMES[config.branding.quoteTemplate as keyof typeof MODERN_TEMPLATE_THEMES] ??
    MODERN_TEMPLATE_THEMES.modern;
  const isPosLayout = modernTheme.layoutVariant !== "stacked";
  const workMode = getCaptureWorkModeFromConfig(config);
  const isEditMode = Boolean(initialEditContext);
  const isEditingQuote = initialEditContext?.mode === "quote";
  const isEditingOrder = initialEditContext?.mode === "order";
  const initialDraftState = useMemo(
    () => buildInitialDraftState(config, initialEditContext),
    [config, initialEditContext]
  );
  const initialCustomerName =
    initialEditContext?.customerName?.trim() || initialContext?.customerName?.trim() || "";
  const initialCustomerPhone =
    initialEditContext?.customerPhone?.trim() || initialContext?.customerPhone?.trim() || "";
  const initialClientId =
    initialEditContext?.clientId?.trim() || initialContext?.clientId?.trim() || null;
  const initialNotes = initialEditContext?.notes?.trim() || "";
  const initialAssignedUserId = initialEditContext?.assignedToUserId?.trim() || "";
  const initialFlowType = initialEditContext?.flowType ?? ServiceOrderFlowType.WALK_IN;
  const editEntityId = initialEditContext?.entityId ?? "";
  const editOrderStatus = initialEditContext?.status ?? null;
  const initialScheduledFor =
    initialEditContext?.scheduledFor
      ? toDatetimeLocalValue(initialEditContext.scheduledFor, timeZone)
      : "";
  const editCaptureIntent: CaptureIntentMode | null = !initialEditContext
    ? null
    : isEditingQuote
      ? "quote"
      : initialFlowType === ServiceOrderFlowType.SCHEDULED
        ? "appointment"
        : "paid";
  const requestedCaptureIntent: CaptureIntentMode | null =
    editCaptureIntent ??
    (initialContext?.intent === "paid"
      ? "paid"
      : initialContext?.intent === "quote"
        ? "quote"
        : initialContext?.intent === "order" && workMode === "scheduled"
          ? "appointment"
          : null);
  const captureIntents = useMemo(
    () =>
      isEditingQuote
        ? (["quote"] as CaptureIntentMode[])
        : isEditingOrder
          ? (["paid", "appointment"] as CaptureIntentMode[])
        : demoMode
          ? (["paid", "appointment", "quote"] as CaptureIntentMode[])
          : getAvailableCaptureIntents({
              canSaveQuotes,
              canSaveOrders,
              canChargeOrders,
              canScheduleOrders,
            }),
    [
      canChargeOrders,
      canSaveOrders,
      canSaveQuotes,
      canScheduleOrders,
      demoMode,
      isEditingOrder,
      isEditingQuote,
    ]
  );
  const defaultCaptureIntent = useMemo(
    () =>
      editCaptureIntent
        ? editCaptureIntent
        : demoMode
        ? requestedCaptureIntent ?? (workMode === "scheduled" ? "appointment" : "paid")
        : getDefaultCaptureIntent({
            workMode,
            canSaveQuotes,
            canSaveOrders,
            canChargeOrders,
            canScheduleOrders,
            requestedIntent: requestedCaptureIntent,
          }),
    [
      canChargeOrders,
      canSaveOrders,
      canSaveQuotes,
      canScheduleOrders,
      demoMode,
      editCaptureIntent,
      requestedCaptureIntent,
      workMode,
    ]
  );
  const initialCaptureIntent = isEditMode
    ? editCaptureIntent
    : requestedCaptureIntent || captureIntents.length === 1
      ? defaultCaptureIntent
      : null;
  const initialSaveIntent = isEditMode
    ? isEditingQuote
      ? "quote"
      : editOrderStatus === ServiceOrderStatus.PAID
        ? "paid"
        : "order"
    : initialCaptureIntent === "quote" && canSaveQuotes
      ? "quote"
      : initialCaptureIntent === "appointment" && canSaveOrders
        ? "order"
        : demoMode || canChargeOrders
          ? "paid"
          : canSaveOrders
            ? "order"
            : "quote";
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>(
    initialDraftState.selectedOptions
  );
  const [extraQuantities, setExtraQuantities] = useState<Record<string, number>>(
    initialDraftState.extraQuantities
  );
  const [manualAdjustments, setManualAdjustments] = useState<ManualAdjustment[]>(
    initialDraftState.manualAdjustments
  );
  const [manualLabel, setManualLabel] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [customerName, setCustomerName] = useState(initialCustomerName);
  const [customerPhone, setCustomerPhone] = useState(initialCustomerPhone);
  const [selectedClient, setSelectedClient] = useState<ClientSearchMatch | null>(null);
  const [clientMatches, setClientMatches] = useState<ClientSearchMatch[]>([]);
  const [searchingClients, setSearchingClients] = useState(false);
  const [orderNotes, setOrderNotes] = useState(initialNotes);
  const [assignedToUserId, setAssignedToUserId] = useState(initialAssignedUserId);
  const [flowType, setFlowType] = useState<ServiceOrderFlowType>(initialFlowType);
  const [scheduledFor, setScheduledFor] = useState(initialScheduledFor);
  const [showOptionalDetails, setShowOptionalDetails] = useState(false);
  const [captureIntent, setCaptureIntent] = useState<CaptureIntentMode | null>(initialCaptureIntent);
  const [saveIntent, setSaveIntent] = useState<SaveIntent>(initialSaveIntent);
  const [downloading, setDownloading] = useState(false);
  const [savingQuote, setSavingQuote] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [resultShortcut, setResultShortcut] = useState<{
    token: number;
    kind: "quote" | "order";
    href: string;
    title: string;
    description: string;
    actionLabel: string;
  } | null>(null);
  const intentSectionRef = useRef<HTMLDivElement>(null);
  const rightRailRef = useRef<HTMLDivElement>(null);
  const closeSectionRef = useRef<HTMLDivElement>(null);
  const initialClientIdRef = useRef(initialClientId);

  useEffect(() => {
    if (isEditMode) {
      return;
    }

    if (!captureIntent) {
      return;
    }

    if (captureIntent === "appointment") {
      setFlowType(ServiceOrderFlowType.SCHEDULED);
      setSaveIntent("order");
      return;
    }

    setFlowType(ServiceOrderFlowType.WALK_IN);
    setScheduledFor("");
    setSaveIntent(
      captureIntent === "quote"
        ? "quote"
        : demoMode || canChargeOrders
          ? "paid"
          : "order"
    );
  }, [captureIntent, canChargeOrders, demoMode, isEditMode]);

  useEffect(() => {
    if (isEditMode) {
      return;
    }

    if (captureIntent && captureIntents.includes(captureIntent)) {
      return;
    }

    if (captureIntents.length === 1) {
      setCaptureIntent(captureIntents[0]);
      return;
    }

    if (requestedCaptureIntent) {
      setCaptureIntent(defaultCaptureIntent);
    }
  }, [captureIntent, captureIntents, defaultCaptureIntent, isEditMode, requestedCaptureIntent]);

  useEffect(() => {
    const query = customerPhone.trim().length >= 2 ? customerPhone.trim() : customerName.trim();

    if (query.length < 2) {
      setClientMatches([]);
      setSearchingClients(false);
      return;
    }

    let ignore = false;
    const timeoutId = window.setTimeout(async () => {
      setSearchingClients(true);

      try {
        const response = await fetch(`/api/clients/search?q=${encodeURIComponent(query)}`, {
          cache: "no-store",
        });
        const payload = await response.json();

        if (ignore) {
          return;
        }

        if (!response.ok) {
          throw new Error(
            getApiErrorMessage({
              status: response.status,
              payloadError: payload.error,
              fallback: "No se pudo buscar clientes",
              permissionAction: "view_clients",
            })
          );
        }

        const matches = Array.isArray(payload) ? payload : [];
        setClientMatches(matches);

        if (initialClientIdRef.current && !selectedClient) {
          const matchedClient = matches.find((client) => client.id === initialClientIdRef.current);

          if (matchedClient) {
            setSelectedClient(matchedClient);
            setCustomerName(matchedClient.name);
            setCustomerPhone(matchedClient.phone ?? "");
            initialClientIdRef.current = null;
          }
        }
      } catch {
        if (!ignore) {
          setClientMatches([]);
        }
      } finally {
        if (!ignore) {
          setSearchingClients(false);
        }
      }
    }, 250);

    return () => {
      ignore = true;
      window.clearTimeout(timeoutId);
    };
  }, [customerName, customerPhone, selectedClient]);

  const activeCategoryCount = useMemo(
    () =>
      Object.values(selectedOptions).filter((items) => items.length > 0).length,
    [selectedOptions]
  );

  const totalSelectionCount = useMemo(
    () => Object.values(selectedOptions).reduce((sum, items) => sum + items.length, 0),
    [selectedOptions]
  );

  const selectedRows = useMemo(
    () =>
      config.categories.flatMap((category) => {
        const selectedIds = selectedOptions[category.id] ?? [];

        return category.options
          .filter((option) => selectedIds.includes(option.id))
          .map((option) => ({
            id: `${category.id}-${option.id}`,
            categoryId: category.id,
            optionId: option.id,
            label: `${category.name} · ${option.name}`,
            amount: option.price,
          }));
      }),
    [config.categories, selectedOptions]
  );

  const extraRows = useMemo(
    () =>
      config.extras.flatMap((extra) => {
        const quantity = extraQuantities[extra.id] ?? 0;

        if (quantity <= 0) {
          return [];
        }

        const billableQuantity = getBillableExtraQuantity(
          extra.pricingType,
          quantity,
          extra.includedQuantity
        );
        const amount = getExtraLiveAmount(
          extra.pricingType,
          quantity,
          extra.includedQuantity,
          extra.price
        );
        const captureMode = getExtraCaptureMode(extra);
        const displayGroup = getExtraDisplayGroup(extra);
        const unitLabel = getExtraUnitLabel(extra);

        return [
          {
            id: extra.id,
            label:
              extra.pricingType === "FIXED"
                ? extra.name
                : `${extra.name} (${formatExtraUnits(quantity, unitLabel)})`,
            amount,
            quantity,
            pricingType: extra.pricingType,
            billableQuantity,
            includedQuantity: extra.includedQuantity,
            captureMode,
            displayGroup,
            unitLabel,
          },
        ];
      }),
    [config.extras, extraQuantities]
  );

  const total = useMemo(
    () =>
      [...selectedRows, ...extraRows, ...manualAdjustments].reduce(
        (sum, item) => sum + item.amount,
        0
      ),
    [extraRows, manualAdjustments, selectedRows]
  );
  const quoteNoun =
    (presentation?.quoteLabel || "cotización").toLowerCase() === "cotizar"
      ? "propuesta"
      : presentation?.quoteLabel?.toLowerCase() || "cotización";
  const quoteActionLabel = `${isEditingQuote ? "Actualizar" : "Guardar"} ${quoteNoun}`;
  const orderActionLabel = isEditingOrder
    ? flowType === ServiceOrderFlowType.SCHEDULED
      ? "Actualizar cita"
      : "Actualizar orden"
    : flowType === ServiceOrderFlowType.SCHEDULED && canScheduleOrders
      ? "Guardar y agendar"
      : "Guardar trabajo";
  const paidActionLabel = isEditingOrder ? "Actualizar venta" : "Guardar y cobrar";

  function toggleOption(categoryId: string, optionId: string) {
    const category = config.categories.find((item) => item.id === categoryId);

    if (!category) {
      return;
    }

    setSelectedOptions((current) => {
      const currentSelection = current[categoryId] ?? [];
      const alreadySelected = currentSelection.includes(optionId);

      if (alreadySelected) {
        return {
          ...current,
          [categoryId]: currentSelection.filter((item) => item !== optionId),
        };
      }

      const isNewCategory = currentSelection.length === 0;

      if (
        isNewCategory &&
        config.rules.maxSelectedCategories &&
        activeCategoryCount >= config.rules.maxSelectedCategories
      ) {
        setToast({
          message: `Solo puedes activar hasta ${config.rules.maxSelectedCategories} categorías al mismo tiempo.`,
          type: "info",
        });
        return current;
      }

      if (
        config.rules.maxTotalSelections &&
        totalSelectionCount >= config.rules.maxTotalSelections
      ) {
        setToast({
          message: `Solo puedes seleccionar hasta ${config.rules.maxTotalSelections} opciones en total.`,
          type: "info",
        });
        return current;
      }

      return {
        ...current,
        [categoryId]: category.multiSelect ? [...currentSelection, optionId] : [optionId],
      };
    });
  }

  function adjustExtra(extraId: string, delta: number) {
    setExtraQuantities((current) => {
      const nextValue = Math.max(0, (current[extraId] ?? 0) + delta);
      const max = config.rules.maxQuantityPerExtra;

      if (max && nextValue > max) {
        setToast({
          message: `Solo puedes registrar hasta ${max} unidades por extra.`,
          type: "info",
        });
        return current;
      }

      return {
        ...current,
        [extraId]: nextValue,
      };
    });
  }

  function resetQuote() {
    setSelectedOptions(initialDraftState.selectedOptions);
    setExtraQuantities(initialDraftState.extraQuantities);
    setManualAdjustments(initialDraftState.manualAdjustments);
    setManualLabel("");
    setManualAmount("");
    setCustomerName(initialCustomerName);
    setCustomerPhone(initialCustomerPhone);
    setSelectedClient(null);
    setClientMatches([]);
    setOrderNotes(initialNotes);
    setAssignedToUserId(initialAssignedUserId);
    setFlowType(initialFlowType);
    setScheduledFor(initialScheduledFor);
    setCaptureIntent(initialCaptureIntent);
    setSaveIntent(initialSaveIntent);
    initialClientIdRef.current = initialClientId;
  }

  function addManualAdjustment() {
    const label = manualLabel.trim();
    const amount = Number(manualAmount);

    if (!label) {
      setToast({
        message: "Escribe el nombre del ajuste manual.",
        type: "info",
      });
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setToast({
        message: "Escribe un monto válido mayor a cero.",
        type: "info",
      });
      return;
    }

    setManualAdjustments((current) => [
      ...current,
      {
        id: `${Date.now()}-${current.length}`,
        label,
        amount: Math.round(amount),
      },
    ]);
    setManualLabel("");
    setManualAmount("");
  }

  function removeManualAdjustment(id: string) {
    setManualAdjustments((current) => current.filter((item) => item.id !== id));
  }

  function applyClientSuggestion(client: ClientSearchMatch) {
    initialClientIdRef.current = client.id;
    setSelectedClient(client);
    setCustomerName(client.name);
    setCustomerPhone(client.phone ?? "");
    setClientMatches([]);
  }

  function formatClientActivity(value: string | null) {
    if (!value) {
      return "Sin actividad reciente";
    }

    return formatDate(value, {
      locale: config.branding.language,
      timeZone,
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function buildSnapshot() {
    return {
      organizationName,
      businessName: config.branding.businessName,
      total,
      selectedRows,
      extraRows,
      manualAdjustments,
    };
  }

  function buildOrderItems() {
    return [
      ...selectedRows.map((row) => ({
        itemType: ServiceOrderItemType.SERVICE,
        label: row.label,
        quantity: 1,
        unitPrice: row.amount,
        total: row.amount,
        metadata: {
          categoryId: row.categoryId ?? null,
          optionId: row.optionId ?? null,
          categoryName: row.label.split(" · ")[0] ?? null,
          optionName: row.label.split(" · ")[1] ?? null,
        },
      })),
      ...extraRows.map((row) => ({
        itemType: ServiceOrderItemType.EXTRA,
        label: row.label,
        quantity: row.pricingType === "FIXED" ? 1 : row.billableQuantity,
        unitPrice:
          row.pricingType === "FIXED"
            ? row.amount
            : Math.round(row.amount / Math.max(1, row.billableQuantity)),
        total: row.amount,
        metadata: {
          extraId: row.id,
          extraName: row.label.replace(/\s*\([^)]*\)\s*$/, "").trim(),
          pricingType: row.pricingType,
          requestedQuantity: row.quantity,
          billableQuantity: row.billableQuantity,
          includedQuantity: row.includedQuantity,
          captureMode: row.captureMode,
          displayGroup: row.displayGroup,
          unitLabel: row.unitLabel,
        },
      })),
      ...manualAdjustments.map((row) => ({
        itemType: ServiceOrderItemType.ADJUSTMENT,
        label: row.label,
        quantity: 1,
        unitPrice: row.amount,
        total: row.amount,
      })),
    ];
  }

  function buildQuoteItems() {
    return [
      ...selectedRows.map((row) => ({
        itemType: QuoteItemType.SERVICE,
        label: row.label,
        quantity: 1,
        unitPrice: row.amount,
        total: row.amount,
        metadata: {
          categoryId: row.categoryId ?? null,
          optionId: row.optionId ?? null,
          categoryName: row.label.split(" · ")[0] ?? null,
          optionName: row.label.split(" · ")[1] ?? null,
        },
      })),
      ...extraRows.map((row) => ({
        itemType: QuoteItemType.EXTRA,
        label: row.label,
        quantity: row.pricingType === "FIXED" ? 1 : row.billableQuantity,
        unitPrice:
          row.pricingType === "FIXED"
            ? row.amount
            : Math.round(row.amount / Math.max(1, row.billableQuantity)),
        total: row.amount,
        metadata: {
          extraId: row.id,
          extraName: row.label.replace(/\s*\([^)]*\)\s*$/, "").trim(),
          pricingType: row.pricingType,
          requestedQuantity: row.quantity,
          billableQuantity: row.billableQuantity,
          includedQuantity: row.includedQuantity,
          captureMode: row.captureMode,
          displayGroup: row.displayGroup,
          unitLabel: row.unitLabel,
        },
      })),
      ...manualAdjustments.map((row) => ({
        itemType: QuoteItemType.ADJUSTMENT,
        label: row.label,
        quantity: 1,
        unitPrice: row.amount,
        total: row.amount,
      })),
    ];
  }

  const canSaveScheduledOrderWithoutConcepts =
    flowType === ServiceOrderFlowType.SCHEDULED &&
    (captureIntent === "appointment" || isEditingOrder);
  const showMobileStickyBar = total > 0 || canSaveScheduledOrderWithoutConcepts;

  function showQuoteShortcut(quoteId: string, mode: "created" | "updated") {
    setResultShortcut({
      token: Date.now(),
      kind: "quote",
      href: getV2QuoteHref(quoteId),
      title: mode === "created" ? "Propuesta lista" : "Propuesta actualizada",
      description:
        mode === "created"
          ? "Abre el detalle de la propuesta que acabas de capturar."
          : "Abre el detalle para revisar cómo quedó la propuesta actualizada.",
      actionLabel: "Abrir propuesta",
    });
  }

  function showOrderShortcut(orderId: string, mode: "created" | "updated") {
    setResultShortcut({
      token: Date.now(),
      kind: "order",
      href: getV2OrderHref(orderId),
      title: mode === "created" ? "Orden lista" : "Orden actualizada",
      description:
        mode === "created"
          ? "Abre el detalle de la orden que acabas de guardar."
          : "Abre el detalle para revisar cómo quedó la orden actualizada.",
      actionLabel: "Abrir orden",
    });
  }

  async function saveQuote() {
    if (total === 0 || savingQuote) {
      return;
    }

    if (flowType === ServiceOrderFlowType.SCHEDULED && !scheduledFor) {
      setToast({
        message: "Selecciona fecha y hora para guardar la propuesta programada.",
        type: "info",
      });
      return;
    }

    setSavingQuote(true);

    try {
      const response = await fetch(
        isEditingQuote ? `/api/quotes/${editEntityId}` : "/api/quotes",
        {
          method: isEditingQuote ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClient?.id ?? null,
          flowType,
          customerName,
          customerPhone,
          notes: orderNotes,
          scheduledFor:
            flowType === ServiceOrderFlowType.SCHEDULED
              ? serializeDateTimeForApi(scheduledFor, timeZone)
              : null,
          currency: config.branding.currency,
          snapshot: buildSnapshot(),
          items: buildQuoteItems(),
        }),
        }
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage({
            status: response.status,
            payloadError: payload.error,
            fallback: isEditingQuote
              ? "No se pudo actualizar la propuesta"
              : "No se pudo guardar la propuesta",
            permissionAction: isEditingQuote ? undefined : "create_quote",
          })
        );
      }

      setToast({
        message: isEditingQuote
          ? "Propuesta actualizada correctamente."
          : "Propuesta guardada correctamente.",
        type: "success",
      });
      if (payload && typeof payload.id === "string" && payload.id.trim()) {
        showQuoteShortcut(payload.id, isEditingQuote ? "updated" : "created");
      }
      if (!isEditingQuote) {
        resetQuote();
      }
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Error inesperado",
        type: "error",
      });
    } finally {
      setSavingQuote(false);
    }
  }

  async function saveOrder(status: ServiceOrderStatus) {
    if ((total === 0 && !canSaveScheduledOrderWithoutConcepts) || savingOrder) {
      return;
    }

    if (flowType === ServiceOrderFlowType.SCHEDULED && !scheduledFor) {
      setToast({
        message: "Selecciona fecha y hora para guardar este trabajo programado.",
        type: "info",
      });
      return;
    }

    setSavingOrder(true);

    try {
      const response = await fetch(
        isEditingOrder ? `/api/service-orders/${editEntityId}` : "/api/service-orders",
        {
          method: isEditingOrder ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClient?.id ?? null,
          status: isEditingOrder ? editOrderStatus ?? status : status,
          flowType,
          customerName,
          customerPhone,
          notes: orderNotes,
          assignedToUserId: assignedToUserId || null,
          scheduledFor:
            flowType === ServiceOrderFlowType.SCHEDULED
              ? serializeDateTimeForApi(scheduledFor, timeZone)
              : null,
          currency: config.branding.currency,
          snapshot: buildSnapshot(),
          items: buildOrderItems(),
        }),
        }
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage({
            status: response.status,
            payloadError: payload.error,
            fallback: isEditingOrder
              ? "No se pudo actualizar la orden"
              : "No se pudo guardar la orden",
            permissionAction:
              isEditingOrder
                ? undefined
                : status === ServiceOrderStatus.PAID
                  ? "charge_order"
                  : "create_order",
          })
        );
      }

      setToast({
        message: isEditingOrder
          ? "Orden actualizada correctamente."
          : status === ServiceOrderStatus.PAID
            ? "Venta guardada y cobrada correctamente."
            : "Orden guardada correctamente.",
        type: "success",
      });
      if (payload && typeof payload.id === "string" && payload.id.trim()) {
        showOrderShortcut(payload.id, isEditingOrder ? "updated" : "created");
      }
      if (!isEditingOrder) {
        resetQuote();
      }
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Error inesperado",
        type: "error",
      });
    } finally {
      setSavingOrder(false);
    }
  }

  async function downloadSummary() {
    if (total === 0 || downloading) {
      return;
    }

    setDownloading(true);

    try {
      await downloadQuoteImage({
        branding: {
          businessName: config.branding.businessName,
          organizationName,
          logoUrl: effectiveLogoUrl,
          primaryColor: config.branding.primaryColor,
          secondaryColor: config.branding.secondaryColor,
          currency: config.branding.currency,
          language: config.branding.language,
        },
        title:
          config.ui.titles.calculatorTitle || `Resumen ${config.branding.businessName}`,
        subtitle:
          config.ui.titles.calculatorSubtitle || "Resumen de servicios y extras",
        totalLabel: config.ui.labels.total || "Total",
        total,
        isLegacyTemplate,
        filename: "resumen-captura.png",
        rows: [
          ...selectedRows.map((row) => ({
            label: row.label,
            amount: row.amount,
          })),
          ...extraRows.map((row) => ({
            label: row.label,
            amount: row.amount,
            detail:
              row.pricingType === "PER_UNIT"
                ? `Se cobran ${row.billableQuantity} ${row.billableQuantity === 1 ? "unidad" : "unidades"}.`
                : "Cargo fijo",
          })),
          ...manualAdjustments.map((row) => ({
            label: row.label,
            amount: row.amount,
            detail: "Ajuste manual agregado antes de generar el resumen.",
          })),
        ],
      });
    } catch {
      setToast({
        message: "No se pudo descargar el resumen. Intenta nuevamente.",
        type: "error",
      });
    } finally {
      setDownloading(false);
    }
  }

  const availableSaveIntents = (
    isEditingQuote
      ? [
          {
            id: "quote" as const,
            title: "Editar propuesta",
            description: "Actualiza conceptos, fecha y referencias sin salir de captura.",
            icon: <FileText size={18} />,
          },
        ]
      : isEditingOrder
        ? [
            {
              id:
                editOrderStatus === ServiceOrderStatus.PAID
                  ? ("paid" as const)
                  : ("order" as const),
              title:
                flowType === ServiceOrderFlowType.SCHEDULED
                  ? "Editar cita"
                  : "Editar orden",
              description:
                flowType === ServiceOrderFlowType.SCHEDULED
                  ? "Ajusta la cita y deja el detalle listo para cobrar después."
                  : "Vuelve a editar conceptos, extras y datos operativos.",
              icon:
                editOrderStatus === ServiceOrderStatus.PAID ? (
                  <CheckCircle2 size={18} />
                ) : flowType === ServiceOrderFlowType.SCHEDULED ? (
                  <CalendarClock size={18} />
                ) : (
                  <ClipboardList size={18} />
                ),
            },
          ]
        : [
            !demoMode && canSaveQuotes
              ? {
                  id: "quote" as const,
                  title: `Solo ${presentation?.quoteLabel?.toLowerCase() || "cotizar"}`,
                  description: "Guárdalo como propuesta para retomarlo después.",
                  icon: <FileText size={18} />,
                }
              : null,
            !demoMode && canSaveOrders
              ? {
                  id: "order" as const,
                  title:
                    flowType === ServiceOrderFlowType.SCHEDULED && canScheduleOrders
                      ? "Agendar trabajo"
                      : "Atender hoy",
                  description:
                    flowType === ServiceOrderFlowType.SCHEDULED && canScheduleOrders
                      ? "Déjalo listo con fecha y hora."
                      : "Guárdalo como orden activa para moverlo hoy.",
                  icon:
                    flowType === ServiceOrderFlowType.SCHEDULED ? (
                      <CalendarClock size={18} />
                    ) : (
                      <ClipboardList size={18} />
                    ),
                }
              : null,
            !demoMode && canSaveOrders && canChargeOrders
              ? {
                  id: "paid" as const,
                  title: "Cobrar ahora",
                  description: "Cierra la venta en este momento.",
                  icon: <CheckCircle2 size={18} />,
                }
              : null,
          ]
  ).filter(Boolean) as CaptureSaveIntentOption[];

  const primarySaveIntent =
    availableSaveIntents.find((item) => item.id === saveIntent) ?? availableSaveIntents[0] ?? null;
  const intentTitle =
    isEditingQuote
      ? "Editar propuesta"
      : isEditingOrder
        ? flowType === ServiceOrderFlowType.SCHEDULED
          ? "Editar cita"
          : "Editar orden"
        : captureIntent === "appointment"
          ? "Agenda rápida"
          : captureIntent === "quote"
            ? "Cotización rápida"
            : "Cobro rápido";
  const intentDescription =
    isEditingQuote
      ? "Recupera la propuesta actual, ajusta servicios, extras y notas, y guarda el nuevo detalle."
      : isEditingOrder
        ? flowType === ServiceOrderFlowType.SCHEDULED
          ? "Vuelve a editar la cita completa. Si aún no defines conceptos, puedes apartarla vacía y cerrarla el día de la atención."
          : "Vuelve a editar conceptos, extras y referencias de esta orden desde el mismo flujo de captura."
        : captureIntent === "appointment"
          ? "Selecciona el servicio, aparta la fecha y guarda la cita sin rodeos."
          : captureIntent === "quote"
            ? "Deja una propuesta lista para convertirla después."
            : canChargeOrders
              ? "Agrega lo necesario y cierra la venta con un solo paso principal."
              : "Agrega lo necesario y deja el trabajo listo para seguirlo hoy.";
  const orderedCaptureIntents = [...captureIntents].sort((left, right) => {
    const preferredOrder =
      workMode === "scheduled"
        ? ["appointment", "paid", "quote"]
        : ["paid", "appointment", "quote"];

    return preferredOrder.indexOf(left) - preferredOrder.indexOf(right);
  });
  const primaryActionLabel = demoMode
    ? "Ver acciones demo"
    : isEditingQuote
      ? quoteActionLabel
    : isEditingOrder
        ? editOrderStatus === ServiceOrderStatus.PAID
          ? paidActionLabel
          : orderActionLabel
        : captureIntent === "quote"
          ? quoteActionLabel
          : captureIntent === "appointment"
            ? "Agendar"
          : canChargeOrders
              ? "Cobrar ahora"
              : "Guardar trabajo";
  const catalogTitle = isEditingQuote
    ? "Edita la propuesta"
    : isEditingOrder
      ? flowType === ServiceOrderFlowType.SCHEDULED
        ? "Edita la cita"
        : "Edita la orden"
      : captureIntent === "paid"
        ? "Agrega lo que vas a cobrar"
        : captureIntent === "appointment"
          ? "Elige lo que vas a agendar"
          : "Arma la cotización";
  const catalogHelperText = isEditingQuote
    ? "Activa, quita o cambia conceptos para actualizar esta propuesta."
    : isEditingOrder
      ? flowType === ServiceOrderFlowType.SCHEDULED
        ? "Edita servicios ahora o deja la cita apartada para completar el detalle el día de la atención."
        : "Ajusta servicios y conceptos con el mismo flujo de captura."
      : captureIntent === "paid"
        ? "Toca los servicios o productos que quieres agregar al cobro."
        : captureIntent === "appointment"
          ? "Toca los servicios que vas a apartar en la cita."
          : "Toca los conceptos que quieres dejar en la propuesta.";
  const extrasTitle =
    isEditingQuote || isEditingOrder
      ? "Extras y complementos"
      : captureIntent === "paid"
        ? "Extras rápidos"
        : config.ui.titles.extrasTitle || "Extras";
  const extrasHelperText =
    isEditingQuote || isEditingOrder
      ? "Úsalos para ajustar rápidamente cargos adicionales, unidades o materiales."
      : captureIntent === "paid"
        ? "Úsalos cuando quieras subir el ticket sin escribir."
        : config.ui.texts.extrasHelper ||
          "Ajusta extras y cantidades según lo que necesites registrar.";
  const summaryTitle = isEditingQuote
    ? "Detalle actual de la propuesta"
    : isEditingOrder
      ? flowType === ServiceOrderFlowType.SCHEDULED
        ? "Detalle actual de la cita"
        : "Detalle actual de la orden"
      : captureIntent === "appointment"
        ? "Lo que vas a agendar"
        : captureIntent === "quote"
          ? "Lo que vas a cotizar"
          : "Lo que vas a cobrar";
  const summaryEmptyMessage = canSaveScheduledOrderWithoutConcepts
    ? "Puedes apartar esta cita sin conceptos todavía. Agrega servicios, extras o productos más tarde cuando llegue el momento de atender y cobrar."
    : captureIntent === "appointment"
      ? "Selecciona al menos un servicio antes de apartar la cita."
      : captureIntent === "quote"
        ? "Selecciona al menos un concepto para preparar la cotización."
        : "Selecciona al menos un concepto para empezar a cobrar.";
  const walkInFallbackIntent: CaptureIntentMode =
    captureIntents.includes("paid")
      ? "paid"
      : captureIntents.includes("quote")
        ? "quote"
        : "appointment";

  function scrollToCaptureSection(target: RefObject<HTMLDivElement | null>) {
    const targetNode = target.current;

    if (!targetNode) {
      return;
    }

    const rightRailNode = rightRailRef.current;

    if (
      rightRailNode &&
      rightRailNode.scrollHeight > rightRailNode.clientHeight + 8
    ) {
      const railRect = rightRailNode.getBoundingClientRect();
      const targetRect = targetNode.getBoundingClientRect();
      const nextTop =
        rightRailNode.scrollTop + (targetRect.top - railRect.top) - 16;

      rightRailNode.scrollTo({
        top: Math.max(0, nextTop),
        behavior: "smooth",
      });
      return;
    }

    targetNode.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function runPrimaryCaptureAction() {
    if (!captureIntent) {
      intentSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (demoMode) {
      scrollToCaptureSection(closeSectionRef);
      return;
    }

    if (captureIntent === "quote") {
      void saveQuote();
      return;
    }

    void saveOrder(
      captureIntent === "paid" && canChargeOrders
        ? ServiceOrderStatus.PAID
        : ServiceOrderStatus.CONFIRMED
    );
  }

  return (
    <>
      <main
        className="admin-shell min-h-full py-3 pb-32 text-slate-950 sm:py-4 lg:py-6 lg:pb-8"
        style={{ background: modernTheme.pageBackground }}
      >
        <div className="w-full space-y-4 sm:space-y-5">
          <CaptureExperienceHeader
            kicker={captureIntent ? intentTitle : presentation?.primaryModuleLabel || "Captura"}
            businessName={config.branding.businessName}
            organizationName={organizationName}
            effectiveLogoUrl={effectiveLogoUrl}
            primaryButtonColor={modernTheme.primaryButton}
            surfaceBackground={modernTheme.surfaceBackground}
            surfaceBorder={modernTheme.surfaceBorder}
            badgeText={modernTheme.badgeText}
            title={
              captureIntent
                ? intentTitle
                : "¿Quieres cobrar, agendar o hacer una cotización?"
            }
            description={
              captureIntent
                ? intentDescription
                : "Primero elige una sola acción. Después el sistema acomoda el resto para ayudarte a terminar más rápido."
            }
          />

          {!isEditMode ? (
            <div ref={intentSectionRef}>
              <CaptureIntentLauncher
                theme={modernTheme}
                intents={orderedCaptureIntents}
                selectedIntent={captureIntent}
                onSelectIntent={setCaptureIntent}
              />
            </div>
          ) : null}

          {captureIntent ? (
            <div className="space-y-4">
              <div
                className={
                  isPosLayout
                    ? "grid gap-5 xl:min-h-0 xl:grid-cols-[minmax(0,1.28fr)_minmax(360px,0.72fr)] 2xl:grid-cols-[minmax(0,1.36fr)_minmax(390px,0.64fr)]"
                    : "grid gap-6 xl:min-h-0 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]"
                }
              >
                <section
                  className={
                    isPosLayout
                      ? "space-y-4 xl:min-h-0 xl:max-h-[calc(100vh-9rem)] xl:overflow-y-auto xl:pr-2"
                      : "space-y-6"
                  }
                >
                  <CaptureCatalogSection
                    categories={config.categories}
                    selectedOptions={selectedOptions}
                    theme={modernTheme}
                    currency={config.branding.currency}
                    language={config.branding.language}
                    title={catalogTitle}
                    helperText={catalogHelperText}
                    onToggleOption={toggleOption}
                  />

                  <CaptureExtrasSection
                    extras={config.extras}
                    extraQuantities={extraQuantities}
                    theme={modernTheme}
                    currency={config.branding.currency}
                    language={config.branding.language}
                    title={extrasTitle}
                    helperText={extrasHelperText}
                    onAdjustExtra={adjustExtra}
                  />

                  {canUseManualAdjustments ? (
                    <CaptureManualAdjustmentsSection
                      manualLabel={manualLabel}
                      manualAmount={manualAmount}
                      manualAdjustments={manualAdjustments}
                      theme={modernTheme}
                      currency={config.branding.currency}
                      language={config.branding.language}
                      onManualLabelChange={setManualLabel}
                      onManualAmountChange={setManualAmount}
                      onAddManualAdjustment={addManualAdjustment}
                      onRemoveManualAdjustment={removeManualAdjustment}
                    />
                  ) : null}
                </section>

                <aside
                  ref={rightRailRef}
                  className={
                    isPosLayout
                      ? "space-y-4 xl:sticky xl:top-24 xl:min-h-0 xl:max-h-[calc(100vh-9rem)] xl:overflow-y-auto xl:self-start xl:pr-2"
                      : "space-y-4 sm:space-y-6 xl:sticky xl:top-24 xl:min-h-0 xl:max-h-[calc(100vh-9rem)] xl:overflow-y-auto xl:self-start xl:pr-2"
                  }
                >
                  <CaptureDetailsStep
                    intentMode={captureIntent}
                    customerName={customerName}
                    customerLabel={presentation?.customerLabel || "Cliente"}
                    immediateLabel={presentation?.immediateLabel || "Atender ahora"}
                    scheduledLabel={presentation?.scheduledLabel || "Agendar"}
                    customerPhone={customerPhone}
                    selectedClient={selectedClient}
                    clientMatches={clientMatches}
                    searchingClients={searchingClients}
                    flowType={flowType}
                    scheduledFor={scheduledFor}
                    canScheduleOrders={canScheduleOrders}
                    showOptionalDetails={showOptionalDetails}
                    orderNotes={orderNotes}
                    assignedToUserId={assignedToUserId}
                    assignableUsers={assignableUsers}
                    currency={config.branding.currency}
                    language={config.branding.language}
                    theme={modernTheme}
                    onCustomerNameChange={(value) => {
                      setCustomerName(value);
                      setSelectedClient(null);
                    }}
                    onCustomerPhoneChange={(value) => {
                      setCustomerPhone(value);
                      setSelectedClient(null);
                    }}
                    onApplyClientSuggestion={applyClientSuggestion}
                    formatClientActivity={formatClientActivity}
                    onFlowTypeChange={(value) => {
                      setFlowType(value);

                      if (
                        !isEditingQuote &&
                        value === ServiceOrderFlowType.WALK_IN &&
                        captureIntent === "appointment"
                      ) {
                        setCaptureIntent(walkInFallbackIntent);
                      }

                      if (
                        !isEditingQuote &&
                        value === ServiceOrderFlowType.SCHEDULED &&
                        captureIntent !== "appointment"
                      ) {
                        setCaptureIntent("appointment");
                      }
                    }}
                    onScheduledForChange={setScheduledFor}
                    onToggleOptionalDetails={() =>
                      setShowOptionalDetails((current) => !current)
                    }
                    onOrderNotesChange={setOrderNotes}
                    onAssignedToUserChange={setAssignedToUserId}
                  />

                  <div className="scroll-mt-32">
                    <CaptureSummaryPanel
                      title={summaryTitle}
                      emptyMessage={summaryEmptyMessage}
                      totalLabel={config.ui.labels.total || "Total"}
                      total={total}
                      selectedRows={selectedRows}
                      extraRows={extraRows}
                      manualAdjustments={manualAdjustments}
                      currency={config.branding.currency}
                      language={config.branding.language}
                      theme={modernTheme}
                      onRemoveSelectedRow={(row) => {
                        if (row.categoryId && row.optionId) {
                          toggleOption(row.categoryId, row.optionId);
                        }
                      }}
                      onAdjustExtra={adjustExtra}
                      onRemoveManualAdjustment={removeManualAdjustment}
                    />
                  </div>

                  <div ref={closeSectionRef} className="scroll-mt-32">
                    <CaptureSaveStep
                      intentMode={captureIntent}
                      intentLocked
                      demoMode={demoMode}
                      availableSaveIntents={availableSaveIntents}
                      primarySaveIntent={primarySaveIntent}
                      saveIntent={saveIntent}
                      quoteActionLabel={quoteActionLabel}
                      orderActionLabel={orderActionLabel}
                      paidActionLabel={paidActionLabel}
                      total={total}
                      canSaveWithoutConcepts={canSaveScheduledOrderWithoutConcepts}
                      savingQuote={savingQuote}
                      savingOrder={savingOrder}
                      downloading={downloading}
                      flowType={flowType}
                      canScheduleOrders={canScheduleOrders}
                      downloadLabel={config.ui.labels.download || "Descargar resumen"}
                      theme={modernTheme}
                      onSaveIntentChange={setSaveIntent}
                      onSaveQuote={saveQuote}
                      onSaveOrder={saveOrder}
                      onDownloadSummary={downloadSummary}
                      onReset={resetQuote}
                      resetLabel={config.ui.labels.reset || "Nueva captura"}
                    />
                  </div>
                </aside>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      <CaptureMobileStickyBar
        total={total}
        totalLabel={config.ui.labels.total || "Total"}
        currency={config.branding.currency}
        language={config.branding.language}
        actionLabel={primaryActionLabel}
        downloadLabel={config.ui.labels.download || "Descargar resumen"}
        itemCount={selectedRows.length + extraRows.length + manualAdjustments.length}
        downloading={downloading}
        canShowWhenEmpty={canSaveScheduledOrderWithoutConcepts}
        theme={modernTheme}
        onAction={runPrimaryCaptureAction}
        onDownloadSummary={downloadSummary}
      />

      {resultShortcut ? (
        <CaptureResultShortcut
          key={resultShortcut.token}
          kind={resultShortcut.kind}
          title={resultShortcut.title}
          description={resultShortcut.description}
          href={resultShortcut.href}
          actionLabel={resultShortcut.actionLabel}
          lifted={showMobileStickyBar}
          onClose={() => setResultShortcut(null)}
        />
      ) : null}

      {toast ? (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      ) : null}
    </>
  );
}
