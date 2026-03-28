import { ExtraPricingType } from "@prisma/client";

import { decorationPrices } from "@/src/features/quote-calculator-v2/lib/pricing";

export const EXTRA_CAPTURE_MODES = {
  standard: {
    label: "Extra estándar",
    helper: "Se captura como un cargo normal o cantidad genérica.",
  },
  individual: {
    label: "Extra individual",
    helper: "Se captura como tonos, uñas, piezas u otras unidades individuales.",
  },
} as const;

export const EXTRA_DISPLAY_GROUPS = {
  general: {
    label: "Extras",
    helper:
      "Úsalos para cargos adicionales, piezas, materiales o conceptos especiales.",
  },
  tones: {
    label: "Tonos extra",
    helper:
      "Sirve para tonos o colores adicionales que pueden incluir cierta cantidad sin costo.",
  },
  decorations: {
    label: "Decoraciones",
    helper:
      "Agrupa decoraciones, acabados y detalles que normalmente se cobran por unidad.",
  },
} as const;

export const EXTRA_DISPLAY_GROUP_ORDER = ["tones", "decorations", "general"] as const;

export type ExtraCaptureMode = keyof typeof EXTRA_CAPTURE_MODES;
export type ExtraDisplayGroup = keyof typeof EXTRA_DISPLAY_GROUPS;

type ExtraDisplayMetadata = Record<string, unknown> | null | undefined;
type ExtraLike = {
  name?: string | null;
  metadata?: ExtraDisplayMetadata;
  includedQuantity?: number | null;
  pricingType?: ExtraPricingType | "FIXED" | "PER_UNIT" | null;
};

const DECORATION_SOURCE_KEYS = new Set(Object.keys(decorationPrices));

function asMetadata(metadata: ExtraDisplayMetadata) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }

  return { ...metadata };
}

function isDisplayGroup(value: unknown): value is ExtraDisplayGroup {
  return value === "general" || value === "tones" || value === "decorations";
}

function isCaptureMode(value: unknown): value is ExtraCaptureMode {
  return value === "standard" || value === "individual";
}

function cleanUnitLabel(value: string) {
  return value.trim().toLowerCase();
}

function cleanSectionText(value: string) {
  return value.trim();
}

function isFixedPricingType(
  pricingType: ExtraPricingType | "FIXED" | "PER_UNIT"
) {
  return pricingType === ExtraPricingType.FIXED;
}

export function getDefaultUnitLabelForDisplayGroup(displayGroup: ExtraDisplayGroup) {
  if (displayGroup === "tones") {
    return "tono";
  }

  if (displayGroup === "decorations") {
    return "detalle";
  }

  return "unidad";
}

export function getDefaultSectionLabelForDisplayGroup(displayGroup: ExtraDisplayGroup) {
  return EXTRA_DISPLAY_GROUPS[displayGroup].label;
}

export function getDefaultSectionHelperForDisplayGroup(displayGroup: ExtraDisplayGroup) {
  return EXTRA_DISPLAY_GROUPS[displayGroup].helper;
}

export function getExtraDisplayGroup(extra: ExtraLike): ExtraDisplayGroup {
  const metadata = asMetadata(extra.metadata);
  const displayGroup = metadata.displayGroup;

  if (isDisplayGroup(displayGroup)) {
    return displayGroup;
  }

  const sourceKey =
    typeof metadata.sourceKey === "string" ? metadata.sourceKey.trim().toLowerCase() : "";
  const normalizedName = (extra.name || "").trim().toLowerCase();

  if (sourceKey === "extra_tones" || normalizedName.includes("tono")) {
    return "tones";
  }

  if (DECORATION_SOURCE_KEYS.has(sourceKey)) {
    return "decorations";
  }

  return "general";
}

export function getExtraCaptureMode(extra: ExtraLike): ExtraCaptureMode {
  const metadata = asMetadata(extra.metadata);
  const captureMode = metadata.captureMode;

  if (isCaptureMode(captureMode)) {
    return captureMode;
  }

  if (
    getExtraDisplayGroup(extra) !== "general" ||
    Math.max(0, Number(extra.includedQuantity ?? 0)) > 0
  ) {
    return "individual";
  }

  return "standard";
}

export function getExtraUnitLabel(extra: ExtraLike) {
  if (getExtraCaptureMode(extra) !== "individual") {
    return "unidad";
  }

  const metadata = asMetadata(extra.metadata);
  const unitLabel =
    typeof metadata.unitLabel === "string" ? cleanUnitLabel(metadata.unitLabel) : "";

  if (unitLabel) {
    return unitLabel;
  }

  return getDefaultUnitLabelForDisplayGroup(getExtraDisplayGroup(extra));
}

export function getExtraSectionLabel(extra: ExtraLike) {
  if (getExtraCaptureMode(extra) !== "individual") {
    return EXTRA_DISPLAY_GROUPS.general.label;
  }

  const metadata = asMetadata(extra.metadata);
  const sectionLabel =
    typeof metadata.sectionLabel === "string" ? cleanSectionText(metadata.sectionLabel) : "";

  if (sectionLabel) {
    return sectionLabel;
  }

  return getDefaultSectionLabelForDisplayGroup(getExtraDisplayGroup(extra));
}

export function getExtraSectionHelper(extra: ExtraLike) {
  if (getExtraCaptureMode(extra) !== "individual") {
    return EXTRA_DISPLAY_GROUPS.general.helper;
  }

  const metadata = asMetadata(extra.metadata);
  const sectionHelper =
    typeof metadata.sectionHelper === "string" ? cleanSectionText(metadata.sectionHelper) : "";

  if (sectionHelper) {
    return sectionHelper;
  }

  return getDefaultSectionHelperForDisplayGroup(getExtraDisplayGroup(extra));
}

export function withExtraCaptureMode(
  metadata: ExtraDisplayMetadata,
  captureMode: ExtraCaptureMode
) {
  const nextMetadata = asMetadata(metadata);
  nextMetadata.captureMode = captureMode;

  return Object.keys(nextMetadata).length > 0 ? nextMetadata : null;
}

export function withExtraDisplayGroup(
  metadata: ExtraDisplayMetadata,
  displayGroup: ExtraDisplayGroup
) {
  const nextMetadata = asMetadata(metadata);

  if (displayGroup === "general") {
    delete nextMetadata.displayGroup;
  } else {
    nextMetadata.displayGroup = displayGroup;
  }

  return Object.keys(nextMetadata).length > 0 ? nextMetadata : null;
}

export function withExtraUnitLabel(
  metadata: ExtraDisplayMetadata,
  unitLabel: string
) {
  const nextMetadata = asMetadata(metadata);
  const normalizedUnitLabel = cleanUnitLabel(unitLabel);

  if (!normalizedUnitLabel || normalizedUnitLabel === "unidad") {
    delete nextMetadata.unitLabel;
  } else {
    nextMetadata.unitLabel = normalizedUnitLabel;
  }

  return Object.keys(nextMetadata).length > 0 ? nextMetadata : null;
}

export function withExtraSectionLabel(
  metadata: ExtraDisplayMetadata,
  sectionLabel: string
) {
  const nextMetadata = asMetadata(metadata);
  const normalizedSectionLabel = cleanSectionText(sectionLabel);

  if (!normalizedSectionLabel) {
    delete nextMetadata.sectionLabel;
  } else {
    nextMetadata.sectionLabel = normalizedSectionLabel;
  }

  return Object.keys(nextMetadata).length > 0 ? nextMetadata : null;
}

export function withExtraSectionHelper(
  metadata: ExtraDisplayMetadata,
  sectionHelper: string
) {
  const nextMetadata = asMetadata(metadata);
  const normalizedSectionHelper = cleanSectionText(sectionHelper);

  if (!normalizedSectionHelper) {
    delete nextMetadata.sectionHelper;
  } else {
    nextMetadata.sectionHelper = normalizedSectionHelper;
  }

  return Object.keys(nextMetadata).length > 0 ? nextMetadata : null;
}

export function buildExtraMetadata({
  sourceKey,
  displayGroup,
  captureMode,
  unitLabel,
  sectionLabel,
  sectionHelper,
}: {
  sourceKey?: string;
  displayGroup?: ExtraDisplayGroup;
  captureMode?: ExtraCaptureMode;
  unitLabel?: string;
  sectionLabel?: string;
  sectionHelper?: string;
}) {
  let metadata: Record<string, unknown> | null = null;

  if (sourceKey) {
    metadata = {
      ...(metadata ?? {}),
      sourceKey,
    };
  }

  if (displayGroup) {
    metadata = withExtraDisplayGroup(metadata, displayGroup);
  }

  if (captureMode) {
    metadata = withExtraCaptureMode(metadata, captureMode);
  }

  if (unitLabel) {
    metadata = withExtraUnitLabel(metadata, unitLabel);
  }

  if (sectionLabel) {
    metadata = withExtraSectionLabel(metadata, sectionLabel);
  }

  if (sectionHelper) {
    metadata = withExtraSectionHelper(metadata, sectionHelper);
  }

  return metadata;
}

export function getExtraDisplayGroupLabel(displayGroup: ExtraDisplayGroup) {
  return EXTRA_DISPLAY_GROUPS[displayGroup].label;
}

export function getExtraDisplayGroupHelper(displayGroup: ExtraDisplayGroup) {
  return EXTRA_DISPLAY_GROUPS[displayGroup].helper;
}

export function getExtraCaptureModeLabel(captureMode: ExtraCaptureMode) {
  return EXTRA_CAPTURE_MODES[captureMode].label;
}

export function getExtraCaptureModeHelper(captureMode: ExtraCaptureMode) {
  return EXTRA_CAPTURE_MODES[captureMode].helper;
}

export function formatExtraUnits(quantity: number, unitLabel: string) {
  const normalizedUnitLabel = cleanUnitLabel(unitLabel) || "unidad";

  if (quantity === 1) {
    return `${quantity} ${normalizedUnitLabel}`;
  }

  if (/[aeiouáéíóú]$/i.test(normalizedUnitLabel)) {
    return `${quantity} ${normalizedUnitLabel}s`;
  }

  return `${quantity} ${normalizedUnitLabel}es`;
}

export function getBillableExtraQuantity(
  pricingType: ExtraPricingType | "FIXED" | "PER_UNIT",
  quantity: number,
  includedQuantity: number
) {
  if (quantity <= 0) {
    return 0;
  }

  if (isFixedPricingType(pricingType)) {
    return 1;
  }

  return Math.max(0, quantity - Math.max(0, includedQuantity));
}

export function getExtraLiveAmount(
  pricingType: ExtraPricingType | "FIXED" | "PER_UNIT",
  quantity: number,
  includedQuantity: number,
  price: number
) {
  if (quantity <= 0) {
    return 0;
  }

  if (isFixedPricingType(pricingType)) {
    return price;
  }

  return getBillableExtraQuantity(pricingType, quantity, includedQuantity) * price;
}

export function getExtraPricingCopy({
  pricingType,
  priceLabel,
  captureMode,
  unitLabel,
}: {
  pricingType: ExtraPricingType | "FIXED" | "PER_UNIT";
  priceLabel: string;
  captureMode: ExtraCaptureMode;
  unitLabel: string;
}) {
  if (isFixedPricingType(pricingType)) {
    return `Cargo fijo de ${priceLabel}`;
  }

  if (captureMode === "individual") {
    return `${priceLabel} por ${cleanUnitLabel(unitLabel) || "unidad"}`;
  }

  return `${priceLabel} por unidad`;
}

export function getExtraChargeSummary({
  pricingType,
  quantity,
  billableQuantity,
  includedQuantity,
  captureMode,
  unitLabel,
}: {
  pricingType: ExtraPricingType | "FIXED" | "PER_UNIT";
  quantity: number;
  billableQuantity: number;
  includedQuantity: number;
  captureMode: ExtraCaptureMode;
  unitLabel: string;
}) {
  if (quantity <= 0) {
    return null;
  }

  if (isFixedPricingType(pricingType)) {
    return null;
  }

  if (captureMode === "individual" || includedQuantity > 0) {
    return `Se cobran ${formatExtraUnits(
      billableQuantity,
      unitLabel
    )} de ${formatExtraUnits(quantity, unitLabel)}.`;
  }

  return `Se cobran ${formatExtraUnits(billableQuantity, unitLabel)}.`;
}

export function groupExtrasForDisplay<T extends ExtraLike>(extras: T[]) {
  const groups = new Map<
    string,
    {
      key: string;
      label: string;
      helper: string;
      extras: T[];
      order: number;
    }
  >();

  extras.forEach((extra) => {
    const captureMode = getExtraCaptureMode(extra);
    const displayGroup = getExtraDisplayGroup(extra);
    const label = getExtraSectionLabel(extra);
    const helper = getExtraSectionHelper(extra);
    const key =
      captureMode === "individual"
        ? `individual:${cleanSectionText(label).toLowerCase()}`
        : "standard:general";
    const existing = groups.get(key);

    if (existing) {
      existing.extras.push(extra);
      return;
    }

    groups.set(key, {
      key,
      label,
      helper,
      extras: [extra],
      order:
        captureMode === "individual"
          ? EXTRA_DISPLAY_GROUP_ORDER.indexOf(displayGroup)
          : EXTRA_DISPLAY_GROUP_ORDER.length + groups.size,
    });
  });

  return Array.from(groups.values()).sort((left, right) => left.order - right.order);
}
