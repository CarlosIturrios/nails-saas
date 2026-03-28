import type { ReactNode } from "react";

import type {
  ExtraCaptureMode,
  ExtraDisplayGroup,
} from "@/src/features/quote-calculator-v2/lib/extra-display";

export interface ManualAdjustment {
  id: string;
  label: string;
  amount: number;
}

export interface ClientSearchMatch {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  quoteCount: number;
  orderCount: number;
  totalPaid: number;
  lastActivityAt: string | null;
}

export type SaveIntent = "quote" | "order" | "paid";

export interface QuoteCalculatorTheme {
  layoutVariant: "stacked" | "pos_classic" | "pos_compact" | "pos_touch";
  pageBackground: string;
  surfaceBackground: string;
  surfaceBorder: string;
  panelBackground: string;
  panelBorder: string;
  badgeBackground: string;
  badgeBorder: string;
  badgeText: string;
  summaryBackground: string;
  summaryBorder: string;
  optionActiveBackground: string;
  optionActiveBorder: string;
  optionInactiveBackground: string;
  optionInactiveBorder: string;
  optionHoverBorder: string;
  accentText: string;
  primaryButton: string;
  primaryButtonHover: string;
  ticketBackground: string;
  ticketBorder: string;
  ticketMutedBackground: string;
  ticketAccentBackground: string;
  ticketAccentText: string;
}

export interface CaptureSaveIntentOption {
  id: SaveIntent;
  title: string;
  description: string;
  icon: ReactNode;
}

export interface CaptureSelectedRow {
  id: string;
  categoryId?: string;
  optionId?: string;
  label: string;
  amount: number;
}

export interface CaptureExtraRow {
  id: string;
  label: string;
  amount: number;
  pricingType: "FIXED" | "PER_UNIT";
  quantity: number;
  billableQuantity: number;
  includedQuantity: number;
  captureMode: ExtraCaptureMode;
  displayGroup: ExtraDisplayGroup;
  unitLabel: string;
}

export function formatMoney(value: number, currency: string, language: string) {
  return new Intl.NumberFormat(language, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}
