import { ExtraPricingType } from "@prisma/client";

import { OrganizationQuoteConfigInput } from "@/src/features/quote-calculator-v2/lib/types";
import { buildDefaultQuoteConfigInput } from "@/src/features/quote-calculator-v2/lib/default-config";

export const QUOTE_CONFIG_PRESETS = {
  none: {
    label: "Sin demo",
    description: "Empieza con una configuración vacía y personalízala desde cero.",
  },
  manicurist_demo: {
    label: "Demo manicurista",
    description: "Carga un ejemplo enfocado en servicios y extras de manicure profesional.",
  },
  nail_salon_demo: {
    label: "Demo salón de uñas",
    description: "Carga un ejemplo más amplio para manicure, pedicure y servicios del salón.",
  },
  mechanic_shop_demo: {
    label: "Demo taller mecánico",
    description: "Incluye diagnósticos, mantenimientos y extras comunes de taller.",
  },
  auto_body_shop_demo: {
    label: "Demo hojalatería y pintura",
    description: "Incluye colisión, enderezado, pintura, wraps y servicios de aire acondicionado automotriz.",
  },
  dentist_demo: {
    label: "Demo dentista",
    description: "Carga una estructura base para consultas, limpiezas y tratamientos dentales.",
  },
  psychologist_demo: {
    label: "Demo psicólogo",
    description: "Carga sesiones, evaluaciones y extras comunes para consulta psicológica.",
  },
  fisioterapeuta_demo: {
    label: "Demo fisioterapeuta",
    description: "Incluye valoraciones, sesiones, rehabilitación y apoyos frecuentes de fisioterapia.",
  },
  barber_shop_demo: {
    label: "Demo barbería",
    description: "Carga cortes, barba, rituales y extras típicos de barber shop.",
  },
  spa_demo: {
    label: "Demo spa",
    description: "Incluye masajes, faciales, paquetes relajantes y complementos de spa.",
  },
  veterinaria_demo: {
    label: "Demo veterinaria",
    description: "Carga consultas, vacunas, procedimientos básicos y cargos extra veterinarios.",
  },
  car_wash_demo: {
    label: "Demo car wash",
    description: "Incluye lavados, detallado, pulido y extras frecuentes de estética automotriz.",
  },
  estetica_demo: {
    label: "Demo estética",
    description: "Carga faciales, depilación, tratamientos corporales y extras de cabina.",
  },
  carpinteria_demo: {
    label: "Demo carpintería",
    description: "Incluye fabricación, instalación, reparaciones y materiales de carpintería.",
  },
  electricista_demo: {
    label: "Demo electricista",
    description: "Carga instalaciones, diagnósticos, mantenimiento y materiales eléctricos.",
  },
} as const;

export type QuoteConfigPresetKey = keyof typeof QUOTE_CONFIG_PRESETS;

function buildBaseUiConfig() {
  return {
    titles: {
      calculatorTitle: "Calculadora de cotizaciones",
      calculatorSubtitle: "Configura servicios y extras según tu negocio.",
      servicesTitle: "Servicios",
      extrasTitle: "Extras",
      summaryTitle: "Resumen",
    },
    texts: {
      servicesHelper: "Agrega categorías y opciones para empezar a cotizar.",
      extrasHelper: "Agrega extras si necesitas cargos adicionales.",
      emptySummary: "Selecciona al menos un servicio para comenzar.",
      downloadHelper: "Descarga una imagen con el resumen de la cotización.",
    },
    labels: {
      total: "Total",
      reset: "Nueva cotización",
      download: "Descargar cotización",
      quantity: "Cantidad",
    },
  };
}

function buildIndustryUiConfig(
  calculatorTitle: string,
  calculatorSubtitle: string,
  servicesTitle = "Servicios",
  extrasTitle = "Extras"
) {
  return {
    titles: {
      calculatorTitle,
      calculatorSubtitle,
      servicesTitle,
      extrasTitle,
      summaryTitle: "Resumen",
    },
    texts: {
      servicesHelper: "Selecciona los servicios que quieres incluir en esta cotización.",
      extrasHelper: "Agrega conceptos adicionales si necesitas ajustar el presupuesto.",
      emptySummary: "Selecciona al menos un servicio para comenzar.",
      downloadHelper: "Descarga una imagen con el resumen de la cotización.",
    },
    labels: {
      total: "Total",
      reset: "Nueva cotización",
      download: "Descargar cotización",
      quantity: "Cantidad",
    },
  };
}

function buildEmptyQuoteConfigInput(
  organizationId: string,
  organizationName: string
): OrganizationQuoteConfigInput {
  return {
    organizationId,
    branding: {
      businessName: organizationName,
      businessType: "general",
      logoUrl: "",
      quoteTemplate: "modern",
      primaryColor: "#1f2937",
      secondaryColor: "#fffaf4",
      currency: "MXN",
      language: "es-MX",
    },
    categories: [],
    extras: [],
    rules: {
      maxSelectedCategories: null,
      maxQuantityPerExtra: null,
      maxTotalSelections: null,
      extraPricingRules: null,
    },
    ui: buildBaseUiConfig(),
  };
}

function buildNailSalonQuoteConfigInput(
  organizationId: string,
  organizationName: string
): OrganizationQuoteConfigInput {
  return {
    organizationId,
    branding: {
      businessName: organizationName,
      businessType: "nail_salon",
      logoUrl: "",
      quoteTemplate: "beauty_soft",
      primaryColor: "#7c3f64",
      secondaryColor: "#fff7fb",
      currency: "MXN",
      language: "es-MX",
    },
    categories: [
      {
        name: "Manicure",
        description: "Servicios rápidos para manos y uñas naturales.",
        multiSelect: false,
        sortOrder: 0,
        metadata: null,
        options: [
          { name: "Manicure básica", description: "", price: 180, sortOrder: 0, metadata: null },
          { name: "Gel semipermanente", description: "", price: 260, sortOrder: 1, metadata: null },
          { name: "Soft gel", description: "", price: 420, sortOrder: 2, metadata: null },
        ],
      },
      {
        name: "Pedicure",
        description: "Opciones para pies y spa básico.",
        multiSelect: false,
        sortOrder: 1,
        metadata: null,
        options: [
          { name: "Pedicure express", description: "", price: 250, sortOrder: 0, metadata: null },
          { name: "Pedicure spa", description: "", price: 380, sortOrder: 1, metadata: null },
        ],
      },
      {
        name: "Retiros y mantenimiento",
        description: "Complementos y servicios de continuidad.",
        multiSelect: true,
        sortOrder: 2,
        metadata: null,
        options: [
          { name: "Retiro de gel", description: "", price: 60, sortOrder: 0, metadata: null },
          { name: "Retoque", description: "", price: 180, sortOrder: 1, metadata: null },
        ],
      },
    ],
    extras: [
      {
        name: "Diseño por uña",
        description: "Decoración individual.",
        price: 15,
        pricingType: ExtraPricingType.PER_UNIT,
        includedQuantity: 0,
        sortOrder: 0,
        metadata: null,
      },
      {
        name: "Pedrería",
        description: "Aplicación de brillo o piedras.",
        price: 20,
        pricingType: ExtraPricingType.PER_UNIT,
        includedQuantity: 0,
        sortOrder: 1,
        metadata: null,
      },
      {
        name: "Reparación de uña",
        description: "Ajuste o reconstrucción puntual.",
        price: 30,
        pricingType: ExtraPricingType.PER_UNIT,
        includedQuantity: 0,
        sortOrder: 2,
        metadata: null,
      },
    ],
    rules: {
      maxSelectedCategories: 3,
      maxQuantityPerExtra: 10,
      maxTotalSelections: null,
      extraPricingRules: null,
    },
    ui: buildIndustryUiConfig(
      "Cotizador de salón de uñas",
      "Arma servicios de manicure, pedicure y extras del salón.",
      "Servicios del salón",
      "Extras y detalles"
    ),
  };
}

function buildMechanicShopQuoteConfigInput(
  organizationId: string,
  organizationName: string
): OrganizationQuoteConfigInput {
  return {
    organizationId,
    branding: {
      businessName: organizationName,
      businessType: "mechanic_shop",
      logoUrl: "",
      quoteTemplate: "workshop_pro",
      primaryColor: "#1f2937",
      secondaryColor: "#f8fafc",
      currency: "MXN",
      language: "es-MX",
    },
    categories: [
      {
        name: "Diagnóstico",
        description: "Revisión inicial del vehículo.",
        multiSelect: false,
        sortOrder: 0,
        metadata: null,
        options: [
          { name: "Diagnóstico general", description: "", price: 450, sortOrder: 0, metadata: null },
          { name: "Diagnóstico por escáner", description: "", price: 650, sortOrder: 1, metadata: null },
        ],
      },
      {
        name: "Mantenimiento",
        description: "Servicios preventivos comunes.",
        multiSelect: true,
        sortOrder: 1,
        metadata: null,
        options: [
          { name: "Cambio de aceite", description: "", price: 850, sortOrder: 0, metadata: null },
          { name: "Afinación básica", description: "", price: 1200, sortOrder: 1, metadata: null },
          { name: "Revisión de frenos", description: "", price: 900, sortOrder: 2, metadata: null },
        ],
      },
      {
        name: "Reparaciones",
        description: "Trabajos correctivos frecuentes.",
        multiSelect: true,
        sortOrder: 2,
        metadata: null,
        options: [
          { name: "Cambio de balatas", description: "", price: 1800, sortOrder: 0, metadata: null },
          { name: "Cambio de batería", description: "", price: 2200, sortOrder: 1, metadata: null },
        ],
      },
    ],
    extras: [
      {
        name: "Refacciones",
        description: "Piezas o materiales extra.",
        price: 1,
        pricingType: ExtraPricingType.PER_UNIT,
        includedQuantity: 0,
        sortOrder: 0,
        metadata: null,
      },
      {
        name: "Servicio urgente",
        description: "Atención prioritaria.",
        price: 500,
        pricingType: ExtraPricingType.FIXED,
        includedQuantity: 0,
        sortOrder: 1,
        metadata: null,
      },
      {
        name: "Mano de obra adicional",
        description: "Horas extra de trabajo.",
        price: 350,
        pricingType: ExtraPricingType.PER_UNIT,
        includedQuantity: 0,
        sortOrder: 2,
        metadata: null,
      },
    ],
    rules: {
      maxSelectedCategories: null,
      maxQuantityPerExtra: null,
      maxTotalSelections: null,
      extraPricingRules: null,
    },
    ui: buildIndustryUiConfig(
      "Cotizador de taller mecánico",
      "Prepara diagnósticos, mantenimientos y reparaciones para tus clientes.",
      "Servicios del taller",
      "Extras del trabajo"
    ),
  };
}

function buildDentistQuoteConfigInput(
  organizationId: string,
  organizationName: string
): OrganizationQuoteConfigInput {
  return {
    organizationId,
    branding: {
      businessName: organizationName,
      businessType: "dentist",
      logoUrl: "",
      quoteTemplate: "clinical_clean",
      primaryColor: "#0f766e",
      secondaryColor: "#f0fdfa",
      currency: "MXN",
      language: "es-MX",
    },
    categories: [
      {
        name: "Consulta",
        description: "Servicios iniciales de valoración.",
        multiSelect: false,
        sortOrder: 0,
        metadata: null,
        options: [
          { name: "Primera valoración", description: "", price: 600, sortOrder: 0, metadata: null },
          { name: "Consulta de seguimiento", description: "", price: 450, sortOrder: 1, metadata: null },
        ],
      },
      {
        name: "Higiene y prevención",
        description: "Tratamientos preventivos y limpieza.",
        multiSelect: true,
        sortOrder: 1,
        metadata: null,
        options: [
          { name: "Limpieza dental", description: "", price: 850, sortOrder: 0, metadata: null },
          { name: "Aplicación de flúor", description: "", price: 300, sortOrder: 1, metadata: null },
        ],
      },
      {
        name: "Restauración",
        description: "Servicios correctivos frecuentes.",
        multiSelect: true,
        sortOrder: 2,
        metadata: null,
        options: [
          { name: "Resina simple", description: "", price: 900, sortOrder: 0, metadata: null },
          { name: "Extracción simple", description: "", price: 1200, sortOrder: 1, metadata: null },
        ],
      },
    ],
    extras: [
      {
        name: "Radiografía",
        description: "Imagen de apoyo al diagnóstico.",
        price: 250,
        pricingType: ExtraPricingType.PER_UNIT,
        includedQuantity: 0,
        sortOrder: 0,
        metadata: null,
      },
      {
        name: "Material especial",
        description: "Costo extra por material clínico.",
        price: 400,
        pricingType: ExtraPricingType.PER_UNIT,
        includedQuantity: 0,
        sortOrder: 1,
        metadata: null,
      },
      {
        name: "Cita urgente",
        description: "Atención prioritaria fuera de agenda.",
        price: 500,
        pricingType: ExtraPricingType.FIXED,
        includedQuantity: 0,
        sortOrder: 2,
        metadata: null,
      },
    ],
    rules: {
      maxSelectedCategories: null,
      maxQuantityPerExtra: null,
      maxTotalSelections: null,
      extraPricingRules: null,
    },
    ui: buildIndustryUiConfig(
      "Cotizador dental",
      "Organiza consultas, limpiezas y tratamientos de forma clara.",
      "Servicios dentales",
      "Estudios y cargos extra"
    ),
  };
}

function buildAutoBodyShopQuoteConfigInput(
  organizationId: string,
  organizationName: string
): OrganizationQuoteConfigInput {
  return {
    organizationId,
    branding: {
      businessName: organizationName,
      businessType: "auto_body_shop",
      logoUrl: "",
      quoteTemplate: "workshop_pro",
      primaryColor: "#334155",
      secondaryColor: "#f8fafc",
      currency: "MXN",
      language: "es-MX",
    },
    categories: [
      {
        name: "Colisión y reparación",
        description: "Trabajos de enderezado y reparación por impacto.",
        multiSelect: true,
        sortOrder: 0,
        metadata: null,
        options: [
          { name: "Reparación de golpe leve", description: "", price: 2500, sortOrder: 0, metadata: null },
          { name: "Enderezado de panel", description: "", price: 4200, sortOrder: 1, metadata: null },
          { name: "Reparación estructural", description: "", price: 8500, sortOrder: 2, metadata: null },
        ],
      },
      {
        name: "Pintura automotriz",
        description: "Servicios de pintura parcial o completa.",
        multiSelect: true,
        sortOrder: 1,
        metadata: null,
        options: [
          { name: "Pintura por pieza", description: "", price: 1800, sortOrder: 0, metadata: null },
          { name: "Repintado color original", description: "", price: 14000, sortOrder: 1, metadata: null },
          { name: "Cambio total de color", description: "", price: 18500, sortOrder: 2, metadata: null },
        ],
      },
      {
        name: "Imagen y acabado",
        description: "Servicios estéticos y de protección.",
        multiSelect: true,
        sortOrder: 2,
        metadata: null,
        options: [
          { name: "Desabollado sin pintura", description: "", price: 1600, sortOrder: 0, metadata: null },
          { name: "Pulido y detallado", description: "", price: 2200, sortOrder: 1, metadata: null },
          { name: "Instalación de wrap", description: "", price: 9500, sortOrder: 2, metadata: null },
        ],
      },
      {
        name: "Aire acondicionado",
        description: "Servicio y mantenimiento del A/C automotriz.",
        multiSelect: true,
        sortOrder: 3,
        metadata: null,
        options: [
          { name: "Diagnóstico de A/C", description: "", price: 650, sortOrder: 0, metadata: null },
          { name: "Recarga de gas refrigerante", description: "", price: 1450, sortOrder: 1, metadata: null },
          { name: "Cambio de componente A/C", description: "", price: 3200, sortOrder: 2, metadata: null },
        ],
      },
    ],
    extras: [
      {
        name: "Material extra",
        description: "Pintura, lija, masilla o materiales adicionales.",
        price: 1,
        pricingType: ExtraPricingType.PER_UNIT,
        includedQuantity: 0,
        sortOrder: 0,
        metadata: null,
      },
      {
        name: "Color tricapa o especial",
        description: "Cargo adicional por acabado premium.",
        price: 2500,
        pricingType: ExtraPricingType.FIXED,
        includedQuantity: 0,
        sortOrder: 1,
        metadata: null,
      },
      {
        name: "Desmontaje adicional",
        description: "Trabajo extra para molduras, faros o piezas especiales.",
        price: 750,
        pricingType: ExtraPricingType.PER_UNIT,
        includedQuantity: 0,
        sortOrder: 2,
        metadata: null,
      },
    ],
    rules: {
      maxSelectedCategories: null,
      maxQuantityPerExtra: null,
      maxTotalSelections: null,
      extraPricingRules: null,
    },
    ui: buildIndustryUiConfig(
      "Cotizador de hojalatería y pintura",
      "Cotiza reparación, pintura, wraps y aire acondicionado automotriz.",
      "Servicios del taller",
      "Materiales y extras"
    ),
  };
}

function buildPsychologistQuoteConfigInput(
  organizationId: string,
  organizationName: string
): OrganizationQuoteConfigInput {
  return {
    organizationId,
    branding: {
      businessName: organizationName,
      businessType: "psychologist",
      logoUrl: "",
      quoteTemplate: "wellness_calm",
      primaryColor: "#5b4b8a",
      secondaryColor: "#faf7ff",
      currency: "MXN",
      language: "es-MX",
    },
    categories: [
      {
        name: "Sesiones",
        description: "Consultas psicológicas individuales o grupales.",
        multiSelect: false,
        sortOrder: 0,
        metadata: null,
        options: [
          { name: "Sesión individual", description: "", price: 700, sortOrder: 0, metadata: null },
          { name: "Sesión de pareja", description: "", price: 950, sortOrder: 1, metadata: null },
          { name: "Sesión familiar", description: "", price: 1200, sortOrder: 2, metadata: null },
        ],
      },
      {
        name: "Evaluaciones",
        description: "Procesos de valoración y diagnóstico.",
        multiSelect: true,
        sortOrder: 1,
        metadata: null,
        options: [
          { name: "Entrevista inicial", description: "", price: 650, sortOrder: 0, metadata: null },
          { name: "Evaluación psicológica", description: "", price: 1500, sortOrder: 1, metadata: null },
        ],
      },
    ],
    extras: [
      {
        name: "Reporte clínico",
        description: "Documento de seguimiento o valoración.",
        price: 600,
        pricingType: ExtraPricingType.FIXED,
        includedQuantity: 0,
        sortOrder: 0,
        metadata: null,
      },
      {
        name: "Sesión urgente",
        description: "Atención prioritaria.",
        price: 350,
        pricingType: ExtraPricingType.FIXED,
        includedQuantity: 0,
        sortOrder: 1,
        metadata: null,
      },
      {
        name: "Seguimiento extra",
        description: "Bloques adicionales de seguimiento.",
        price: 250,
        pricingType: ExtraPricingType.PER_UNIT,
        includedQuantity: 0,
        sortOrder: 2,
        metadata: null,
      },
    ],
    rules: {
      maxSelectedCategories: null,
      maxQuantityPerExtra: null,
      maxTotalSelections: null,
      extraPricingRules: null,
    },
    ui: buildIndustryUiConfig(
      "Cotizador psicológico",
      "Organiza sesiones, evaluaciones y servicios complementarios.",
      "Servicios de consulta",
      "Extras y documentos"
    ),
  };
}

function buildPhysiotherapyQuoteConfigInput(
  organizationId: string,
  organizationName: string
): OrganizationQuoteConfigInput {
  return {
    organizationId,
    branding: {
      businessName: organizationName,
      businessType: "physiotherapy",
      logoUrl: "",
      quoteTemplate: "wellness_calm",
      primaryColor: "#0f766e",
      secondaryColor: "#f0fdfa",
      currency: "MXN",
      language: "es-MX",
    },
    categories: [
      {
        name: "Valoración inicial",
        description: "Primera revisión y plan terapéutico.",
        multiSelect: false,
        sortOrder: 0,
        metadata: null,
        options: [
          { name: "Valoración general", description: "", price: 700, sortOrder: 0, metadata: null },
          { name: "Valoración deportiva", description: "", price: 850, sortOrder: 1, metadata: null },
        ],
      },
      {
        name: "Sesiones de fisioterapia",
        description: "Tratamientos de seguimiento y rehabilitación.",
        multiSelect: true,
        sortOrder: 1,
        metadata: null,
        options: [
          { name: "Sesión individual", description: "", price: 650, sortOrder: 0, metadata: null },
          { name: "Rehabilitación postoperatoria", description: "", price: 900, sortOrder: 1, metadata: null },
          { name: "Terapia deportiva", description: "", price: 800, sortOrder: 2, metadata: null },
        ],
      },
      {
        name: "Técnicas complementarias",
        description: "Apoyos adicionales dentro del tratamiento.",
        multiSelect: true,
        sortOrder: 2,
        metadata: null,
        options: [
          { name: "Vendaje neuromuscular", description: "", price: 250, sortOrder: 0, metadata: null },
          { name: "Electroterapia", description: "", price: 300, sortOrder: 1, metadata: null },
          { name: "Masaje terapéutico", description: "", price: 400, sortOrder: 2, metadata: null },
        ],
      },
    ],
    extras: [
      {
        name: "Sesión a domicilio",
        description: "Cargo adicional por traslado.",
        price: 250,
        pricingType: ExtraPricingType.FIXED,
        includedQuantity: 0,
        sortOrder: 0,
        metadata: null,
      },
      {
        name: "Material terapéutico",
        description: "Bandas, compresas o insumos extra.",
        price: 120,
        pricingType: ExtraPricingType.PER_UNIT,
        includedQuantity: 0,
        sortOrder: 1,
        metadata: null,
      },
      {
        name: "Reporte de evolución",
        description: "Documento de seguimiento para el paciente.",
        price: 300,
        pricingType: ExtraPricingType.FIXED,
        includedQuantity: 0,
        sortOrder: 2,
        metadata: null,
      },
    ],
    rules: {
      maxSelectedCategories: null,
      maxQuantityPerExtra: null,
      maxTotalSelections: null,
      extraPricingRules: null,
    },
    ui: buildIndustryUiConfig(
      "Cotizador de fisioterapia",
      "Organiza valoraciones, sesiones y apoyos terapéuticos de forma clara.",
      "Servicios terapéuticos",
      "Cargos y apoyos extra"
    ),
  };
}

function buildBarberShopQuoteConfigInput(
  organizationId: string,
  organizationName: string
): OrganizationQuoteConfigInput {
  return {
    organizationId,
    branding: {
      businessName: organizationName,
      businessType: "barber_shop",
      logoUrl: "",
      quoteTemplate: "barber_classic",
      primaryColor: "#3f3f46",
      secondaryColor: "#fafaf9",
      currency: "MXN",
      language: "es-MX",
    },
    categories: [
      {
        name: "Corte",
        description: "Servicios principales de barbería.",
        multiSelect: false,
        sortOrder: 0,
        metadata: null,
        options: [
          { name: "Corte clásico", description: "", price: 180, sortOrder: 0, metadata: null },
          { name: "Fade / degradado", description: "", price: 220, sortOrder: 1, metadata: null },
          { name: "Corte premium", description: "", price: 280, sortOrder: 2, metadata: null },
        ],
      },
      {
        name: "Barba y grooming",
        description: "Detalle de barba y cuidado facial.",
        multiSelect: true,
        sortOrder: 1,
        metadata: null,
        options: [
          { name: "Alineado de barba", description: "", price: 120, sortOrder: 0, metadata: null },
          { name: "Afeitado clásico", description: "", price: 180, sortOrder: 1, metadata: null },
          { name: "Mascarilla facial", description: "", price: 150, sortOrder: 2, metadata: null },
        ],
      },
      {
        name: "Paquetes",
        description: "Combos rápidos para ticket promedio.",
        multiSelect: true,
        sortOrder: 2,
        metadata: null,
        options: [
          { name: "Corte + barba", description: "", price: 320, sortOrder: 0, metadata: null },
          { name: "Corte + ceja", description: "", price: 250, sortOrder: 1, metadata: null },
        ],
      },
    ],
    extras: [
      {
        name: "Diseño de líneas",
        description: "Detalle personalizado en el corte.",
        price: 40,
        pricingType: ExtraPricingType.FIXED,
        includedQuantity: 0,
        sortOrder: 0,
        metadata: null,
      },
      {
        name: "Producto de acabado",
        description: "Pomada, cera o spray adicional.",
        price: 60,
        pricingType: ExtraPricingType.PER_UNIT,
        includedQuantity: 0,
        sortOrder: 1,
        metadata: null,
      },
      {
        name: "Servicio fuera de horario",
        description: "Atención especial fuera del horario habitual.",
        price: 120,
        pricingType: ExtraPricingType.FIXED,
        includedQuantity: 0,
        sortOrder: 2,
        metadata: null,
      },
    ],
    rules: {
      maxSelectedCategories: null,
      maxQuantityPerExtra: null,
      maxTotalSelections: null,
      extraPricingRules: null,
    },
    ui: buildIndustryUiConfig(
      "Cotizador de barbería",
      "Prepara cortes, barba y paquetes con una experiencia simple y clara.",
      "Servicios de barber shop",
      "Extras del servicio"
    ),
  };
}

function buildSpaQuoteConfigInput(
  organizationId: string,
  organizationName: string
): OrganizationQuoteConfigInput {
  return {
    organizationId,
    branding: {
      businessName: organizationName,
      businessType: "spa",
      logoUrl: "",
      quoteTemplate: "wellness_calm",
      primaryColor: "#7c6f64",
      secondaryColor: "#fdf8f2",
      currency: "MXN",
      language: "es-MX",
    },
    categories: [
      {
        name: "Masajes",
        description: "Sesiones relajantes y terapéuticas.",
        multiSelect: false,
        sortOrder: 0,
        metadata: null,
        options: [
          { name: "Masaje relajante", description: "", price: 750, sortOrder: 0, metadata: null },
          { name: "Masaje descontracturante", description: "", price: 900, sortOrder: 1, metadata: null },
          { name: "Masaje con piedras calientes", description: "", price: 1100, sortOrder: 2, metadata: null },
        ],
      },
      {
        name: "Faciales",
        description: "Cuidado y limpieza de piel.",
        multiSelect: true,
        sortOrder: 1,
        metadata: null,
        options: [
          { name: "Facial básico", description: "", price: 650, sortOrder: 0, metadata: null },
          { name: "Facial hidratante", description: "", price: 850, sortOrder: 1, metadata: null },
          { name: "Facial anti-edad", description: "", price: 1200, sortOrder: 2, metadata: null },
        ],
      },
      {
        name: "Paquetes spa",
        description: "Experiencias completas para relajación.",
        multiSelect: true,
        sortOrder: 2,
        metadata: null,
        options: [
          { name: "Spa individual", description: "", price: 1800, sortOrder: 0, metadata: null },
          { name: "Spa para dos", description: "", price: 3200, sortOrder: 1, metadata: null },
        ],
      },
    ],
    extras: [
      {
        name: "Aromaterapia",
        description: "Esencias y experiencia sensorial.",
        price: 120,
        pricingType: ExtraPricingType.FIXED,
        includedQuantity: 0,
        sortOrder: 0,
        metadata: null,
      },
      {
        name: "Tiempo extra",
        description: "Bloques adicionales al servicio.",
        price: 180,
        pricingType: ExtraPricingType.PER_UNIT,
        includedQuantity: 0,
        sortOrder: 1,
        metadata: null,
      },
      {
        name: "Kit de cuidado",
        description: "Producto adicional para el cliente.",
        price: 250,
        pricingType: ExtraPricingType.FIXED,
        includedQuantity: 0,
        sortOrder: 2,
        metadata: null,
      },
    ],
    rules: {
      maxSelectedCategories: null,
      maxQuantityPerExtra: null,
      maxTotalSelections: null,
      extraPricingRules: null,
    },
    ui: buildIndustryUiConfig(
      "Cotizador de spa",
      "Arma experiencias de masaje, facial y relajación para cada cliente.",
      "Experiencias del spa",
      "Complementos"
    ),
  };
}

function buildVeterinaryQuoteConfigInput(
  organizationId: string,
  organizationName: string
): OrganizationQuoteConfigInput {
  return {
    organizationId,
    branding: {
      businessName: organizationName,
      businessType: "veterinary",
      logoUrl: "",
      quoteTemplate: "clinical_clean",
      primaryColor: "#166534",
      secondaryColor: "#f0fdf4",
      currency: "MXN",
      language: "es-MX",
    },
    categories: [
      {
        name: "Consulta",
        description: "Atención general y valoración inicial.",
        multiSelect: false,
        sortOrder: 0,
        metadata: null,
        options: [
          { name: "Consulta general", description: "", price: 450, sortOrder: 0, metadata: null },
          { name: "Consulta de seguimiento", description: "", price: 350, sortOrder: 1, metadata: null },
          { name: "Consulta urgente", description: "", price: 650, sortOrder: 2, metadata: null },
        ],
      },
      {
        name: "Prevención",
        description: "Servicios frecuentes de control y cuidado.",
        multiSelect: true,
        sortOrder: 1,
        metadata: null,
        options: [
          { name: "Vacunación", description: "", price: 380, sortOrder: 0, metadata: null },
          { name: "Desparasitación", description: "", price: 220, sortOrder: 1, metadata: null },
          { name: "Limpieza básica", description: "", price: 300, sortOrder: 2, metadata: null },
        ],
      },
      {
        name: "Procedimientos",
        description: "Servicios clínicos sencillos.",
        multiSelect: true,
        sortOrder: 2,
        metadata: null,
        options: [
          { name: "Curación", description: "", price: 280, sortOrder: 0, metadata: null },
          { name: "Estudio básico", description: "", price: 550, sortOrder: 1, metadata: null },
        ],
      },
    ],
    extras: [
      {
        name: "Medicamento adicional",
        description: "Cargo por medicamento o insumo.",
        price: 1,
        pricingType: ExtraPricingType.PER_UNIT,
        includedQuantity: 0,
        sortOrder: 0,
        metadata: null,
      },
      {
        name: "Servicio a domicilio",
        description: "Traslado para atención fuera de clínica.",
        price: 250,
        pricingType: ExtraPricingType.FIXED,
        includedQuantity: 0,
        sortOrder: 1,
        metadata: null,
      },
      {
        name: "Estudio extra",
        description: "Cargo adicional por apoyo diagnóstico.",
        price: 350,
        pricingType: ExtraPricingType.PER_UNIT,
        includedQuantity: 0,
        sortOrder: 2,
        metadata: null,
      },
    ],
    rules: {
      maxSelectedCategories: null,
      maxQuantityPerExtra: null,
      maxTotalSelections: null,
      extraPricingRules: null,
    },
    ui: buildIndustryUiConfig(
      "Cotizador veterinario",
      "Organiza consultas, vacunas y procedimientos de manera sencilla.",
      "Servicios veterinarios",
      "Insumos y cargos extra"
    ),
  };
}

function buildCarWashQuoteConfigInput(
  organizationId: string,
  organizationName: string
): OrganizationQuoteConfigInput {
  return {
    organizationId,
    branding: {
      businessName: organizationName,
      businessType: "car_wash",
      logoUrl: "",
      quoteTemplate: "carwash_fresh",
      primaryColor: "#0369a1",
      secondaryColor: "#f0f9ff",
      currency: "MXN",
      language: "es-MX",
    },
    categories: [
      {
        name: "Lavado exterior",
        description: "Servicios rápidos para presentación del vehículo.",
        multiSelect: false,
        sortOrder: 0,
        metadata: null,
        options: [
          { name: "Lavado básico", description: "", price: 120, sortOrder: 0, metadata: null },
          { name: "Lavado premium", description: "", price: 180, sortOrder: 1, metadata: null },
        ],
      },
      {
        name: "Limpieza interior",
        description: "Detalle de cabina y aspirado.",
        multiSelect: true,
        sortOrder: 1,
        metadata: null,
        options: [
          { name: "Aspirado interior", description: "", price: 90, sortOrder: 0, metadata: null },
          { name: "Lavado de vestiduras", description: "", price: 380, sortOrder: 1, metadata: null },
          { name: "Sanitizado", description: "", price: 150, sortOrder: 2, metadata: null },
        ],
      },
      {
        name: "Detallado",
        description: "Servicios premium de estética automotriz.",
        multiSelect: true,
        sortOrder: 2,
        metadata: null,
        options: [
          { name: "Encerado", description: "", price: 250, sortOrder: 0, metadata: null },
          { name: "Pulido básico", description: "", price: 650, sortOrder: 1, metadata: null },
          { name: "Detallado completo", description: "", price: 1400, sortOrder: 2, metadata: null },
        ],
      },
    ],
    extras: [
      {
        name: "Motor",
        description: "Lavado o detalle de compartimiento de motor.",
        price: 180,
        pricingType: ExtraPricingType.FIXED,
        includedQuantity: 0,
        sortOrder: 0,
        metadata: null,
      },
      {
        name: "Eliminación de manchas",
        description: "Tratamiento puntual adicional.",
        price: 90,
        pricingType: ExtraPricingType.PER_UNIT,
        includedQuantity: 0,
        sortOrder: 1,
        metadata: null,
      },
      {
        name: "Protección cerámica rápida",
        description: "Acabado extra de protección.",
        price: 320,
        pricingType: ExtraPricingType.FIXED,
        includedQuantity: 0,
        sortOrder: 2,
        metadata: null,
      },
    ],
    rules: {
      maxSelectedCategories: null,
      maxQuantityPerExtra: null,
      maxTotalSelections: null,
      extraPricingRules: null,
    },
    ui: buildIndustryUiConfig(
      "Cotizador de car wash",
      "Arma lavados, detallados y extras para cada vehículo.",
      "Servicios del car wash",
      "Extras del detallado"
    ),
  };
}

function buildBeautyClinicQuoteConfigInput(
  organizationId: string,
  organizationName: string
): OrganizationQuoteConfigInput {
  return {
    organizationId,
    branding: {
      businessName: organizationName,
      businessType: "beauty_clinic",
      logoUrl: "",
      quoteTemplate: "beauty_soft",
      primaryColor: "#be185d",
      secondaryColor: "#fdf2f8",
      currency: "MXN",
      language: "es-MX",
    },
    categories: [
      {
        name: "Faciales",
        description: "Tratamientos de limpieza y cuidado del rostro.",
        multiSelect: false,
        sortOrder: 0,
        metadata: null,
        options: [
          { name: "Limpieza facial", description: "", price: 550, sortOrder: 0, metadata: null },
          { name: "Facial profundo", description: "", price: 850, sortOrder: 1, metadata: null },
          { name: "Facial anti-edad", description: "", price: 1200, sortOrder: 2, metadata: null },
        ],
      },
      {
        name: "Corporal",
        description: "Tratamientos de moldeado y bienestar.",
        multiSelect: true,
        sortOrder: 1,
        metadata: null,
        options: [
          { name: "Masaje reductivo", description: "", price: 700, sortOrder: 0, metadata: null },
          { name: "Radiofrecuencia", description: "", price: 1100, sortOrder: 1, metadata: null },
          { name: "Drenaje linfático", description: "", price: 650, sortOrder: 2, metadata: null },
        ],
      },
      {
        name: "Depilación",
        description: "Servicios de depilación por zona.",
        multiSelect: true,
        sortOrder: 2,
        metadata: null,
        options: [
          { name: "Depilación facial", description: "", price: 180, sortOrder: 0, metadata: null },
          { name: "Axila", description: "", price: 150, sortOrder: 1, metadata: null },
          { name: "Pierna completa", description: "", price: 420, sortOrder: 2, metadata: null },
        ],
      },
    ],
    extras: [
      {
        name: "Ampolleta / activo especial",
        description: "Producto concentrado adicional.",
        price: 180,
        pricingType: ExtraPricingType.PER_UNIT,
        includedQuantity: 0,
        sortOrder: 0,
        metadata: null,
      },
      {
        name: "Mascarilla premium",
        description: "Complemento para elevar el tratamiento.",
        price: 220,
        pricingType: ExtraPricingType.FIXED,
        includedQuantity: 0,
        sortOrder: 1,
        metadata: null,
      },
      {
        name: "Paquete de seguimiento",
        description: "Visita adicional con precio preferente.",
        price: 350,
        pricingType: ExtraPricingType.FIXED,
        includedQuantity: 0,
        sortOrder: 2,
        metadata: null,
      },
    ],
    rules: {
      maxSelectedCategories: null,
      maxQuantityPerExtra: null,
      maxTotalSelections: null,
      extraPricingRules: null,
    },
    ui: buildIndustryUiConfig(
      "Cotizador de estética",
      "Organiza faciales, tratamientos corporales y depilación con claridad.",
      "Servicios de cabina",
      "Productos y complementos"
    ),
  };
}

function buildCarpentryQuoteConfigInput(
  organizationId: string,
  organizationName: string
): OrganizationQuoteConfigInput {
  return {
    organizationId,
    branding: {
      businessName: organizationName,
      businessType: "carpentry",
      logoUrl: "",
      quoteTemplate: "craft_warm",
      primaryColor: "#92400e",
      secondaryColor: "#fffbeb",
      currency: "MXN",
      language: "es-MX",
    },
    categories: [
      {
        name: "Fabricación",
        description: "Trabajo nuevo sobre medida.",
        multiSelect: false,
        sortOrder: 0,
        metadata: null,
        options: [
          { name: "Mueble pequeño", description: "", price: 2500, sortOrder: 0, metadata: null },
          { name: "Closet / gabinete", description: "", price: 7500, sortOrder: 1, metadata: null },
          { name: "Cocina integral", description: "", price: 18000, sortOrder: 2, metadata: null },
        ],
      },
      {
        name: "Instalación",
        description: "Montaje y ajustes en sitio.",
        multiSelect: true,
        sortOrder: 1,
        metadata: null,
        options: [
          { name: "Instalación básica", description: "", price: 1200, sortOrder: 0, metadata: null },
          { name: "Ajuste en sitio", description: "", price: 650, sortOrder: 1, metadata: null },
          { name: "Retiro de mueble anterior", description: "", price: 900, sortOrder: 2, metadata: null },
        ],
      },
      {
        name: "Reparación y mantenimiento",
        description: "Correcciones y mejoras sobre carpintería existente.",
        multiSelect: true,
        sortOrder: 2,
        metadata: null,
        options: [
          { name: "Reparación de puertas", description: "", price: 850, sortOrder: 0, metadata: null },
          { name: "Cambio de herrajes", description: "", price: 450, sortOrder: 1, metadata: null },
          { name: "Barnizado", description: "", price: 1200, sortOrder: 2, metadata: null },
        ],
      },
    ],
    extras: [
      {
        name: "Material premium",
        description: "Melamina, madera o acabado especial.",
        price: 1,
        pricingType: ExtraPricingType.PER_UNIT,
        includedQuantity: 0,
        sortOrder: 0,
        metadata: null,
      },
      {
        name: "Traslado",
        description: "Cargo por entrega o visita fuera de zona.",
        price: 500,
        pricingType: ExtraPricingType.FIXED,
        includedQuantity: 0,
        sortOrder: 1,
        metadata: null,
      },
      {
        name: "Diseño / plano",
        description: "Desarrollo previo de propuesta.",
        price: 750,
        pricingType: ExtraPricingType.FIXED,
        includedQuantity: 0,
        sortOrder: 2,
        metadata: null,
      },
    ],
    rules: {
      maxSelectedCategories: null,
      maxQuantityPerExtra: null,
      maxTotalSelections: null,
      extraPricingRules: null,
    },
    ui: buildIndustryUiConfig(
      "Cotizador de carpintería",
      "Cotiza fabricación, instalación y reparaciones con una base clara.",
      "Servicios de carpintería",
      "Materiales y cargos extra"
    ),
  };
}

function buildElectricianQuoteConfigInput(
  organizationId: string,
  organizationName: string
): OrganizationQuoteConfigInput {
  return {
    organizationId,
    branding: {
      businessName: organizationName,
      businessType: "electrician",
      logoUrl: "",
      quoteTemplate: "electrician_bold",
      primaryColor: "#ca8a04",
      secondaryColor: "#fffbeb",
      currency: "MXN",
      language: "es-MX",
    },
    categories: [
      {
        name: "Diagnóstico",
        description: "Revisión inicial y detección de fallas.",
        multiSelect: false,
        sortOrder: 0,
        metadata: null,
        options: [
          { name: "Diagnóstico residencial", description: "", price: 450, sortOrder: 0, metadata: null },
          { name: "Diagnóstico comercial", description: "", price: 750, sortOrder: 1, metadata: null },
        ],
      },
      {
        name: "Instalaciones",
        description: "Trabajo nuevo o ampliaciones eléctricas.",
        multiSelect: true,
        sortOrder: 1,
        metadata: null,
        options: [
          { name: "Instalación de contacto", description: "", price: 280, sortOrder: 0, metadata: null },
          { name: "Instalación de lámpara", description: "", price: 350, sortOrder: 1, metadata: null },
          { name: "Centro de carga", description: "", price: 2500, sortOrder: 2, metadata: null },
        ],
      },
      {
        name: "Mantenimiento y reparación",
        description: "Corrección de fallas y ajustes frecuentes.",
        multiSelect: true,
        sortOrder: 2,
        metadata: null,
        options: [
          { name: "Cambio de apagador", description: "", price: 220, sortOrder: 0, metadata: null },
          { name: "Corrección de corto", description: "", price: 650, sortOrder: 1, metadata: null },
          { name: "Revisión de cableado", description: "", price: 900, sortOrder: 2, metadata: null },
        ],
      },
    ],
    extras: [
      {
        name: "Material eléctrico",
        description: "Cable, tubería o piezas adicionales.",
        price: 1,
        pricingType: ExtraPricingType.PER_UNIT,
        includedQuantity: 0,
        sortOrder: 0,
        metadata: null,
      },
      {
        name: "Urgencia",
        description: "Atención prioritaria el mismo día.",
        price: 450,
        pricingType: ExtraPricingType.FIXED,
        includedQuantity: 0,
        sortOrder: 1,
        metadata: null,
      },
      {
        name: "Trabajo en altura",
        description: "Cargo adicional por instalación compleja.",
        price: 350,
        pricingType: ExtraPricingType.FIXED,
        includedQuantity: 0,
        sortOrder: 2,
        metadata: null,
      },
    ],
    rules: {
      maxSelectedCategories: null,
      maxQuantityPerExtra: null,
      maxTotalSelections: null,
      extraPricingRules: null,
    },
    ui: buildIndustryUiConfig(
      "Cotizador eléctrico",
      "Prepara diagnósticos, instalaciones y reparaciones con una estructura clara.",
      "Servicios eléctricos",
      "Materiales y recargos"
    ),
  };
}

export function normalizeQuoteConfigPreset(value: unknown): QuoteConfigPresetKey {
  if (
    value === "manicurist_demo" ||
    value === "nail_salon_demo" ||
    value === "mechanic_shop_demo" ||
    value === "auto_body_shop_demo" ||
    value === "dentist_demo" ||
    value === "psychologist_demo" ||
    value === "fisioterapeuta_demo" ||
    value === "barber_shop_demo" ||
    value === "spa_demo" ||
    value === "veterinaria_demo" ||
    value === "car_wash_demo" ||
    value === "estetica_demo" ||
    value === "carpinteria_demo" ||
    value === "electricista_demo"
  ) {
    return value;
  }

  return "none";
}

export function buildQuoteConfigInputFromPreset(
  preset: QuoteConfigPresetKey,
  organizationId: string,
  organizationName: string
) {
  switch (preset) {
    case "manicurist_demo":
      return buildDefaultQuoteConfigInput(organizationId, organizationName);
    case "nail_salon_demo":
      return buildNailSalonQuoteConfigInput(organizationId, organizationName);
    case "mechanic_shop_demo":
      return buildMechanicShopQuoteConfigInput(organizationId, organizationName);
    case "auto_body_shop_demo":
      return buildAutoBodyShopQuoteConfigInput(organizationId, organizationName);
    case "dentist_demo":
      return buildDentistQuoteConfigInput(organizationId, organizationName);
    case "psychologist_demo":
      return buildPsychologistQuoteConfigInput(organizationId, organizationName);
    case "fisioterapeuta_demo":
      return buildPhysiotherapyQuoteConfigInput(organizationId, organizationName);
    case "barber_shop_demo":
      return buildBarberShopQuoteConfigInput(organizationId, organizationName);
    case "spa_demo":
      return buildSpaQuoteConfigInput(organizationId, organizationName);
    case "veterinaria_demo":
      return buildVeterinaryQuoteConfigInput(organizationId, organizationName);
    case "car_wash_demo":
      return buildCarWashQuoteConfigInput(organizationId, organizationName);
    case "estetica_demo":
      return buildBeautyClinicQuoteConfigInput(organizationId, organizationName);
    case "carpinteria_demo":
      return buildCarpentryQuoteConfigInput(organizationId, organizationName);
    case "electricista_demo":
      return buildElectricianQuoteConfigInput(organizationId, organizationName);
    default:
      return buildEmptyQuoteConfigInput(organizationId, organizationName);
  }
}
