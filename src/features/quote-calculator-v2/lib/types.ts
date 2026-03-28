import { ExtraPricingType } from "@prisma/client";

export const QUOTE_TEMPLATE_OPTIONS = {
  modern: {
    label: "Moderno",
    description: "Diseño limpio y flexible para cualquier giro.",
  },
  retail_express: {
    label: "Retail express",
    description: "Pensado para cobro rápido, lectura inmediata y operación tipo caja.",
  },
  quick_bites: {
    label: "Quick bites",
    description: "Ideal para comida rápida, combos, extras y atención de mostrador.",
  },
  social_cards: {
    label: "Social cards",
    description: "Visual más cercano a apps de consumo, con bloques grandes y directos.",
  },
  ticket_board: {
    label: "Ticket board",
    description: "Más parecido a un tablero de tickets para talleres y servicios intensivos.",
  },
  beauty_soft: {
    label: "Belleza suave",
    description: "Ideal para uñas, estética y negocios de imagen personal.",
  },
  barber_classic: {
    label: "Barber clásico",
    description: "Una presentación sobria y elegante para barberías.",
  },
  wellness_calm: {
    label: "Wellness calmado",
    description: "Pensado para spa, psicología y terapias con un look sereno.",
  },
  clinical_clean: {
    label: "Clínico limpio",
    description: "Funciona muy bien para dentistas, veterinarias y servicios de salud.",
  },
  pos_classic: {
    label: "POS clásico",
    description: "Layout tradicional de caja con catálogo a la izquierda y ticket fijo.",
  },
  pos_compact: {
    label: "POS compacto",
    description: "Más denso y veloz para usuarios que capturan muchas ventas al día.",
  },
  pos_touch: {
    label: "POS touch",
    description: "Botones grandes y cómodos para tabletas, mostrador y pantallas táctiles.",
  },
  workshop_pro: {
    label: "Taller profesional",
    description: "Diseño fuerte y claro para talleres, mecánica y hojalatería.",
  },
  carwash_fresh: {
    label: "Car wash fresh",
    description: "Estilo fresco y brillante para lavado y detallado automotriz.",
  },
  craft_warm: {
    label: "Oficio cálido",
    description: "Buena base para carpintería y trabajos hechos a medida.",
  },
  electrician_bold: {
    label: "Eléctrico enérgico",
    description: "Visual directo y con más contraste para trabajos eléctricos.",
  },
  legacy_gica: {
    label: "Estilo GICA Demo",
    description: "Usa una presentación inspirada en el demo clásico de GICA Nails.",
  },
} as const;

export type QuoteTemplateKey = keyof typeof QUOTE_TEMPLATE_OPTIONS;

export interface QuoteServiceOptionInput {
  id?: string;
  name: string;
  description?: string;
  price: number;
  sortOrder: number;
  metadata?: Record<string, unknown> | null;
}

export interface QuoteServiceCategoryInput {
  id?: string;
  name: string;
  description?: string;
  multiSelect: boolean;
  sortOrder: number;
  metadata?: Record<string, unknown> | null;
  options: QuoteServiceOptionInput[];
}

export interface QuoteExtraOptionInput {
  id?: string;
  name: string;
  description?: string;
  price: number;
  pricingType: ExtraPricingType;
  includedQuantity: number;
  sortOrder: number;
  metadata?: Record<string, unknown> | null;
}

export interface QuoteRulesInput {
  maxSelectedCategories: number | null;
  maxQuantityPerExtra: number | null;
  maxTotalSelections: number | null;
  extraPricingRules?: Record<string, unknown> | null;
}

export interface QuoteBrandingInput {
  businessName: string;
  businessType: string;
  logoUrl: string;
  quoteTemplate: QuoteTemplateKey;
  primaryColor: string;
  secondaryColor: string;
  currency: string;
  language: string;
}

export interface QuoteUiConfigInput {
  titles: Record<string, string>;
  texts: Record<string, string>;
  labels: Record<string, string>;
}

export interface OrganizationQuoteConfigInput {
  organizationId: string;
  branding: QuoteBrandingInput;
  categories: QuoteServiceCategoryInput[];
  extras: QuoteExtraOptionInput[];
  rules: QuoteRulesInput;
  ui: QuoteUiConfigInput;
}

export interface QuoteServiceOptionView extends QuoteServiceOptionInput {
  id: string;
}

export interface QuoteServiceCategoryView extends Omit<QuoteServiceCategoryInput, "options"> {
  id: string;
  options: QuoteServiceOptionView[];
}

export interface QuoteExtraOptionView extends QuoteExtraOptionInput {
  id: string;
}

export interface OrganizationQuoteConfigView {
  organizationId: string;
  branding: QuoteBrandingInput;
  categories: QuoteServiceCategoryView[];
  extras: QuoteExtraOptionView[];
  rules: QuoteRulesInput;
  ui: QuoteUiConfigInput;
}
