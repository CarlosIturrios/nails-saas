import { ExtraPricingType } from "@prisma/client";

import {
  MAX_TECNICAS,
  MAX_UNAS,
  PRECIO_TONO_EXTRA,
  decorationLabels,
  decorationPrices,
  pricing,
} from "@/src/features/quote-calculator-v2/lib/pricing";
import { buildExtraMetadata } from "@/src/features/quote-calculator-v2/lib/extra-display";
import { OrganizationQuoteConfigInput } from "@/src/features/quote-calculator-v2/lib/types";

function stripLeadingEmoji(value: string) {
  return value.replace(/^[^\p{L}\p{N}]+/u, "").trim();
}

export function buildDefaultQuoteConfigInput(
  organizationId: string,
  organizationName: string
): OrganizationQuoteConfigInput {
  const categories = Object.entries(pricing).map(([key, category], index) => ({
    name: category.label,
    description:
      key === "retiro"
        ? "Selecciona uno o varios retiros según el servicio."
        : "Elige la opción que corresponde al servicio seleccionado.",
    multiSelect: category.multiSelect,
    sortOrder: index,
    metadata: {
      sourceKey: key,
    },
    options: category.options.map((option, optionIndex) => ({
      name: option.label,
      description: "",
      price: option.price,
      sortOrder: optionIndex,
      metadata: {
        sourceId: option.id,
      },
    })),
  }));

  const extras = [
    {
      name: "Tonos extra",
      description: "Incluye 2 tonos sin costo. Cada tono adicional se cobra por unidad.",
      price: PRECIO_TONO_EXTRA,
      pricingType: ExtraPricingType.PER_UNIT,
      includedQuantity: 2,
      sortOrder: 0,
      metadata: buildExtraMetadata({
        sourceKey: "extra_tones",
        displayGroup: "tones",
        captureMode: "individual",
        unitLabel: "tono",
      }),
    },
    ...Object.entries(decorationPrices).map(([key, price], index) => ({
      name: stripLeadingEmoji(decorationLabels[key as keyof typeof decorationLabels]),
      description: "Se cobra por unidad.",
      price,
      pricingType: ExtraPricingType.PER_UNIT,
      includedQuantity: 0,
      sortOrder: index + 1,
      metadata: buildExtraMetadata({
        sourceKey: key,
        displayGroup: "decorations",
        captureMode: "individual",
        unitLabel: "detalle",
      }),
    })),
  ];

  return {
    organizationId,
    branding: {
      businessName: organizationName,
      businessType: "nail_salon",
      logoUrl: "/logo.png",
      quoteTemplate: "legacy_gica",
      primaryColor: "#1f2937",
      secondaryColor: "#fffaf4",
      currency: "MXN",
      language: "es-MX",
    },
    categories,
    extras,
    rules: {
      maxSelectedCategories: MAX_TECNICAS,
      maxQuantityPerExtra: MAX_UNAS,
      maxTotalSelections: null,
      extraPricingRules: null,
    },
    ui: {
      titles: {
        calculatorTitle: "Captura principal",
        calculatorSubtitle: "Configura servicios, extras y el resumen que verá tu cliente.",
        servicesTitle: "Servicios",
        extrasTitle: "Extras",
        summaryTitle: "Resumen",
      },
      texts: {
        servicesHelper: "Selecciona una o varias categorías y luego marca las opciones necesarias.",
        extrasHelper: "Ajusta cantidades y cargos adicionales desde este bloque.",
        emptySummary: "Selecciona al menos un servicio para comenzar.",
        downloadHelper: "Descarga una imagen con el resumen visible para el cliente.",
        captureWorkMode: "hybrid",
      },
      labels: {
        total: "Total",
        reset: "Nueva captura",
        download: "Descargar resumen",
        quantity: "Cantidad",
      },
    },
  };
}
