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
import { CaptureSaveStep } from "@/src/features/quote-calculator-v2/components/CaptureSaveStep";
import { CaptureSummaryPanel } from "@/src/features/quote-calculator-v2/components/CaptureSummaryPanel";
import {
  type CaptureSaveIntentOption,
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
import { formatDate, serializeDateTimeForApi } from "@/src/lib/dates";

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
  const requestedCaptureIntent: CaptureIntentMode | null =
    initialContext?.intent === "paid"
      ? "paid"
      : initialContext?.intent === "quote"
        ? "quote"
        : initialContext?.intent === "order" && workMode === "scheduled"
          ? "appointment"
          : null;
  const captureIntents = useMemo(
    () =>
      demoMode
        ? (["paid", "appointment", "quote"] as CaptureIntentMode[])
        : getAvailableCaptureIntents({
            canSaveQuotes,
            canSaveOrders,
            canChargeOrders,
            canScheduleOrders,
          }),
    [canChargeOrders, canSaveOrders, canSaveQuotes, canScheduleOrders, demoMode]
  );
  const defaultCaptureIntent = useMemo(
    () =>
      demoMode
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
      requestedCaptureIntent,
      workMode,
    ]
  );
  const initialCaptureIntent =
    requestedCaptureIntent || captureIntents.length === 1
      ? defaultCaptureIntent
      : null;
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [extraQuantities, setExtraQuantities] = useState<Record<string, number>>({});
  const [manualAdjustments, setManualAdjustments] = useState<ManualAdjustment[]>([]);
  const [manualLabel, setManualLabel] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [customerName, setCustomerName] = useState(initialContext?.customerName?.trim() || "");
  const [customerPhone, setCustomerPhone] = useState(initialContext?.customerPhone?.trim() || "");
  const [selectedClient, setSelectedClient] = useState<ClientSearchMatch | null>(null);
  const [clientMatches, setClientMatches] = useState<ClientSearchMatch[]>([]);
  const [searchingClients, setSearchingClients] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  const [assignedToUserId, setAssignedToUserId] = useState("");
  const [flowType, setFlowType] = useState<ServiceOrderFlowType>(ServiceOrderFlowType.WALK_IN);
  const [scheduledFor, setScheduledFor] = useState("");
  const [showOptionalDetails, setShowOptionalDetails] = useState(false);
  const [captureIntent, setCaptureIntent] = useState<CaptureIntentMode | null>(initialCaptureIntent);
  const [saveIntent, setSaveIntent] = useState<SaveIntent>(
    initialCaptureIntent === "quote" && canSaveQuotes
        ? "quote"
        : initialCaptureIntent === "appointment" && canSaveOrders
          ? "order"
          : demoMode || canChargeOrders
            ? "paid"
            : canSaveOrders
              ? "order"
              : "quote"
  );
  const [downloading, setDownloading] = useState(false);
  const [savingQuote, setSavingQuote] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const intentSectionRef = useRef<HTMLDivElement>(null);
  const rightRailRef = useRef<HTMLDivElement>(null);
  const closeSectionRef = useRef<HTMLDivElement>(null);
  const initialClientIdRef = useRef(initialContext?.clientId?.trim() || null);

  useEffect(() => {
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
  }, [captureIntent, canChargeOrders, demoMode]);

  useEffect(() => {
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
  }, [captureIntent, captureIntents, defaultCaptureIntent, requestedCaptureIntent]);

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
  const quoteActionLabel = `Guardar ${
    (presentation?.quoteLabel || "cotización").toLowerCase() === "cotizar"
      ? "propuesta"
      : presentation?.quoteLabel.toLowerCase()
  }`;

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
    setSelectedOptions({});
    setExtraQuantities({});
    setManualAdjustments([]);
    setManualLabel("");
    setManualAmount("");
    setCustomerName(initialContext?.customerName?.trim() || "");
    setCustomerPhone(initialContext?.customerPhone?.trim() || "");
    setSelectedClient(null);
    setClientMatches([]);
    setOrderNotes("");
    setAssignedToUserId("");
    setFlowType(
      captureIntent === "appointment"
        ? ServiceOrderFlowType.SCHEDULED
        : ServiceOrderFlowType.WALK_IN
    );
    setScheduledFor("");
    setSaveIntent(
      captureIntent === "quote"
          ? "quote"
          : captureIntent === "appointment" && (demoMode || canSaveOrders)
            ? "order"
            : demoMode || canChargeOrders
              ? "paid"
              : canSaveOrders
                ? "order"
                : "quote"
    );
    initialClientIdRef.current = initialContext?.clientId?.trim() || null;
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
      const response = await fetch("/api/quotes", {
        method: "POST",
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
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage({
            status: response.status,
            payloadError: payload.error,
            fallback: "No se pudo guardar la propuesta",
            permissionAction: "create_quote",
          })
        );
      }

      resetQuote();
      setToast({
        message: "Propuesta guardada correctamente.",
        type: "success",
      });
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
    if (total === 0 || savingOrder) {
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
      const response = await fetch("/api/service-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClient?.id ?? null,
          status,
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
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage({
            status: response.status,
            payloadError: payload.error,
            fallback: "No se pudo guardar la orden",
            permissionAction:
              status === ServiceOrderStatus.PAID ? "charge_order" : "create_order",
          })
        );
      }

      resetQuote();
      setToast({
        message:
          status === ServiceOrderStatus.PAID
            ? "Venta guardada y cobrada correctamente."
            : "Orden guardada correctamente.",
        type: "success",
      });
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

  const availableSaveIntents = [
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
  ].filter(Boolean) as CaptureSaveIntentOption[];

  const primarySaveIntent =
    availableSaveIntents.find((item) => item.id === saveIntent) ?? availableSaveIntents[0] ?? null;
  const intentTitle =
    captureIntent === "appointment"
      ? "Agenda rápida"
      : captureIntent === "quote"
        ? "Cotización rápida"
        : "Cobro rápido";
  const intentDescription =
    captureIntent === "appointment"
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
    : captureIntent === "quote"
      ? quoteActionLabel
      : captureIntent === "appointment"
        ? "Agendar"
        : canChargeOrders
          ? "Cobrar ahora"
          : "Guardar trabajo";
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

          <div ref={intentSectionRef}>
            <CaptureIntentLauncher
              theme={modernTheme}
              intents={orderedCaptureIntents}
              selectedIntent={captureIntent}
              onSelectIntent={setCaptureIntent}
            />
          </div>

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
                    title={
                      captureIntent === "paid"
                        ? "Agrega lo que vas a cobrar"
                        : captureIntent === "appointment"
                          ? "Elige lo que vas a agendar"
                          : "Arma la cotización"
                    }
                    helperText={
                      captureIntent === "paid"
                        ? "Toca los servicios o productos que quieres agregar al cobro."
                        : captureIntent === "appointment"
                          ? "Toca los servicios que vas a apartar en la cita."
                          : "Toca los conceptos que quieres dejar en la propuesta."
                    }
                    onToggleOption={toggleOption}
                  />

                  <CaptureExtrasSection
                    extras={config.extras}
                    extraQuantities={extraQuantities}
                    theme={modernTheme}
                    currency={config.branding.currency}
                    language={config.branding.language}
                    title={
                      captureIntent === "paid" ? "Extras rápidos" : config.ui.titles.extrasTitle || "Extras"
                    }
                    helperText={
                      captureIntent === "paid"
                        ? "Úsalos cuando quieras subir el ticket sin escribir."
                        : config.ui.texts.extrasHelper ||
                          "Ajusta extras y cantidades según lo que necesites registrar."
                    }
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

                      if (value === ServiceOrderFlowType.WALK_IN && captureIntent === "appointment") {
                        setCaptureIntent(walkInFallbackIntent);
                      }

                      if (value === ServiceOrderFlowType.SCHEDULED && captureIntent !== "appointment") {
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
                      title={
                        captureIntent === "appointment"
                          ? "Lo que vas a agendar"
                          : captureIntent === "quote"
                            ? "Lo que vas a cotizar"
                            : "Lo que vas a cobrar"
                      }
                      emptyMessage={
                        captureIntent === "appointment"
                          ? "Selecciona al menos un servicio antes de apartar la cita."
                          : captureIntent === "quote"
                            ? "Selecciona al menos un concepto para preparar la cotización."
                            : "Selecciona al menos un concepto para empezar a cobrar."
                      }
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
                      total={total}
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
        theme={modernTheme}
        onAction={runPrimaryCaptureAction}
        onDownloadSummary={downloadSummary}
      />

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
