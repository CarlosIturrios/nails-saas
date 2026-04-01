import type { ReactNode } from "react";
import type {
  ServiceOrderFlowType,
  ServiceOrderStatus,
} from "@prisma/client";

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

export interface CaptureSnapshotSelectedRow {
  id?: string;
  categoryId?: string;
  optionId?: string;
  label: string;
  amount: number;
}

export interface CaptureSelectedRow {
  id: string;
  categoryId?: string;
  optionId?: string;
  label: string;
  amount: number;
}

export interface CaptureSnapshotExtraRow {
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

export interface CapturePersistedItem {
  itemType: "SERVICE" | "EXTRA" | "ADJUSTMENT";
  label: string;
  quantity: number;
  total: number;
  metadata?: Record<string, unknown> | null;
}

export interface CaptureEditContext {
  mode: "quote" | "order";
  entityId: string;
  clientId?: string | null;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  assignedToUserId?: string | null;
  flowType: ServiceOrderFlowType;
  scheduledFor?: string | null;
  status?: ServiceOrderStatus | null;
  snapshot?: Record<string, unknown> | null;
  items: CapturePersistedItem[];
}

export function formatMoney(value: number, currency: string, language: string) {
  return new Intl.NumberFormat(language, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}
