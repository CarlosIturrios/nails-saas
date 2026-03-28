"use client";

import { ExtraPricingType } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  ImagePlus,
  MapPin,
  Phone,
  Plus,
  Scissors,
  Sparkles,
  Stethoscope,
  Store,
  Trash2,
  UtensilsCrossed,
  Wrench,
} from "lucide-react";
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";

import Toast from "@/src/components/ui/Toast";
import { CaptureSetupShell } from "@/src/features/quote-config-admin/components/CaptureSetupShell";
import { InlineSaveIndicator } from "@/src/features/quote-config-admin/components/InlineSaveIndicator";
import {
  captureSetupReducer,
  createCaptureSetupState,
  type CaptureSetupSectionId,
} from "@/src/features/quote-config-admin/lib/capture-setup-state";
import {
  CAPTURE_WORK_MODE_OPTIONS,
  normalizeCaptureWorkMode,
  type CaptureWorkMode,
} from "@/src/features/quote-calculator-v2/lib/capture-flow";
import { getEffectiveLogoUrl } from "@/src/features/quote-calculator-v2/lib/logo";
import {
  buildQuoteConfigInputFromPreset,
  type QuoteConfigPresetKey,
} from "@/src/features/quote-calculator-v2/lib/presets";
import {
  OrganizationQuoteConfigInput,
  OrganizationQuoteConfigView,
  QUOTE_TEMPLATE_OPTIONS,
  QuoteExtraOptionInput,
  QuoteServiceCategoryInput,
  QuoteTemplateKey,
} from "@/src/features/quote-calculator-v2/lib/types";

interface QuoteConfigWizardV2Props {
  initialConfig: OrganizationQuoteConfigView;
  organizations: Array<{
    id: string;
    name: string;
  }>;
  basePath?: string;
}

interface BusinessOption {
  id: string;
  label: string;
  description: string;
  preset: QuoteConfigPresetKey;
  businessType: string;
  recommendedTemplate: QuoteTemplateKey;
  defaultWorkMode: CaptureWorkMode;
  icon: ReactNode;
  aliases: string[];
}

interface TemplateStyleOption {
  id: QuoteTemplateKey;
  label: string;
  description: string;
  eyebrow: string;
}

interface CaptureSetupSectionDefinition {
  id: CaptureSetupSectionId;
  label: string;
  title: string;
  description: string;
  helperText: string;
  optional?: boolean;
}

interface CaptureSetupDraftPayload {
  activeSectionId: CaptureSetupSectionId;
  config: OrganizationQuoteConfigInput;
  updatedAt: number;
}

const CAPTURE_SETUP_SECTIONS: CaptureSetupSectionDefinition[] = [
  {
    id: "business",
    label: "Giro",
    title: "¿Qué tipo de negocio tienes?",
    description:
      "Elige el negocio que más se parece a cómo trabajas. Con eso te cargamos una base útil desde el primer momento.",
    helperText:
      "El giro define recomendados, estilo visual y la forma de trabajo que tu equipo verá primero.",
  },
  {
    id: "catalog",
    label: "Lo que ofreces",
    title: "¿Qué vendes normalmente?",
    description:
      "Ya te dejamos una base lista. Ajusta solo nombres y precios de lo que sí vendes hoy, sin sentir que tienes que dejarlo perfecto.",
    helperText:
      "Puedes dejar esta parte a medias y volver después. La idea es empezar con una base que ya sirva.",
    optional: true,
  },
  {
    id: "mode",
    label: "Cómo atiendes",
    title: "¿Cómo atiendes la mayor parte del tiempo?",
    description:
      "Esto define qué acción aparecerá primero cuando tu equipo abra la captura para vender, agendar o cotizar.",
    helperText:
      "Solo cambia el punto de arranque. Después podrás seguir cobrando, agendando y cotizando desde el mismo lugar.",
  },
  {
    id: "identity",
    label: "Identidad básica",
    title: "Datos básicos de tu negocio",
    description:
      "Pon lo que te ayude desde hoy. Si algo no lo tienes a la mano, puedes seguir y completarlo más tarde.",
    helperText:
      "Todo aquí es opcional. Lo más importante es que el flujo de trabajo quede claro y listo para operar.",
    optional: true,
  },
  {
    id: "activation",
    label: "Estilo y activación",
    title: "Revisa el estilo y deja todo listo",
    description:
      "Elige cómo se va a ver la captura y confirma que la base quedó lista para cobrar, agendar o cotizar sin fricción.",
    helperText:
      "Cuando termines aquí, tu equipo ya puede entrar y operar. Si aún quieres ajustar algo, puedes guardar borrador.",
  },
];

const BUSINESS_OPTIONS: BusinessOption[] = [
  {
    id: "dentist",
    label: "Dentista",
    description: "Consultas, tratamientos y citas con espacio para urgencias.",
    preset: "dentist_demo",
    businessType: "dentist",
    recommendedTemplate: "clinical_clean",
    defaultWorkMode: "scheduled",
    icon: <Stethoscope size={20} />,
    aliases: ["dentist", "dentista", "odontologia", "dental"],
  },
  {
    id: "barber",
    label: "Barbería",
    description: "Cortes, barba, walk-ins y citas futuras desde la misma pantalla.",
    preset: "barber_shop_demo",
    businessType: "barber_shop",
    recommendedTemplate: "pos_touch",
    defaultWorkMode: "hybrid",
    icon: <Scissors size={20} />,
    aliases: ["barber_shop", "barberia", "barber", "peluqueria"],
  },
  {
    id: "nails",
    label: "Uñas",
    description: "Servicios, retoques y extras listos para cobrar o apartar.",
    preset: "nail_salon_demo",
    businessType: "nail_salon",
    recommendedTemplate: "beauty_soft",
    defaultWorkMode: "hybrid",
    icon: <Sparkles size={20} />,
    aliases: ["nail_salon", "manicurist", "manicurista", "unas", "uñas"],
  },
  {
    id: "mechanic",
    label: "Taller",
    description: "Diagnóstico, reparación y cobro rápido de trabajos de hoy o pendientes.",
    preset: "mechanic_shop_demo",
    businessType: "mechanic_shop",
    recommendedTemplate: "pos_classic",
    defaultWorkMode: "hybrid",
    icon: <Wrench size={20} />,
    aliases: ["mechanic_shop", "taller", "mecanico", "mecánico", "auto_body_shop"],
  },
  {
    id: "food",
    label: "Comida rápida",
    description: "Mostrador, combos, toppings y tickets rápidos tipo POS.",
    preset: "fast_food_demo",
    businessType: "fast_food",
    recommendedTemplate: "pos_touch",
    defaultWorkMode: "walk_in",
    icon: <UtensilsCrossed size={20} />,
    aliases: ["fast_food", "comida_rapida", "hot_dogs", "hamburguesas", "tacos"],
  },
  {
    id: "psychology",
    label: "Psicología",
    description: "Sesiones, seguimiento y agenda simple para citas recurrentes.",
    preset: "psychologist_demo",
    businessType: "psychologist",
    recommendedTemplate: "wellness_calm",
    defaultWorkMode: "scheduled",
    icon: <CalendarClock size={20} />,
    aliases: ["psychologist", "psicologo", "psicología", "psicologia"],
  },
  {
    id: "other",
    label: "Otro negocio",
    description: "Te dejamos una base general para que empieces y la ajustes sobre la marcha.",
    preset: "none",
    businessType: "general",
    recommendedTemplate: "pos_classic",
    defaultWorkMode: "hybrid",
    icon: <BriefcaseBusiness size={20} />,
    aliases: ["general", "otro", "other"],
  },
];

const TEMPLATE_STYLE_OPTIONS: TemplateStyleOption[] = [
  {
    id: "retail_express",
    label: "Retail express",
    eyebrow: "OXXO / Walmart",
    description: "Lectura inmediata, precios claros y ambiente de caja rápida.",
  },
  {
    id: "quick_bites",
    label: "Quick bites",
    eyebrow: "Fast food POS",
    description: "Ideal para mostrador, combos, extras y cobro en pocos toques.",
  },
  {
    id: "social_cards",
    label: "Social cards",
    eyebrow: "App social",
    description: "Bloques grandes, más visuales y con feeling cercano a apps de consumo.",
  },
  {
    id: "ticket_board",
    label: "Ticket board",
    eyebrow: "Taller / tickets",
    description: "Más fuerte y operativo para trabajos, órdenes y seguimiento.",
  },
  {
    id: "beauty_soft",
    label: "Beauty soft",
    eyebrow: "Belleza",
    description: "Suave, cercano y muy claro para imagen personal y cuidado.",
  },
  {
    id: "clinical_clean",
    label: "Clinical clean",
    eyebrow: "Clínico",
    description: "Limpio y confiable para salud, consulta y servicios formales.",
  },
  {
    id: "pos_classic",
    label: "POS clásico",
    eyebrow: "Caja tradicional",
    description: "Catálogo a la izquierda y ticket fijo para cobrar rápido sin perder visibilidad.",
  },
  {
    id: "pos_compact",
    label: "POS compacto",
    eyebrow: "Power user",
    description: "Más denso para negocios con mucho volumen diario y captura continua.",
  },
  {
    id: "pos_touch",
    label: "POS touch",
    eyebrow: "Tablet / touch",
    description: "Botones grandes y cómodos para mostrador, caja y pantallas táctiles.",
  },
  {
    id: "wellness_calm",
    label: "Wellness calm",
    eyebrow: "Terapia / sesiones",
    description: "Más sereno para citas, seguimiento y atención pausada.",
  },
  {
    id: "modern",
    label: "Moderno",
    eyebrow: "General",
    description: "Base equilibrada si quieres algo simple y flexible para cualquier giro.",
  },
];

const TEMPLATE_PREVIEW_TONES: Partial<Record<
  TemplateStyleOption["id"],
  {
    surface: string;
    accent: string;
    card: string;
  }
>> = {
  retail_express: {
    surface: "bg-[#f9f4ea]",
    accent: "bg-[#c86f1a]",
    card: "bg-white",
  },
  quick_bites: {
    surface: "bg-[#fff0e5]",
    accent: "bg-[#d6451b]",
    card: "bg-white",
  },
  social_cards: {
    surface: "bg-[#edf6ff]",
    accent: "bg-[#2563eb]",
    card: "bg-white",
  },
  ticket_board: {
    surface: "bg-[#eef2f7]",
    accent: "bg-[#1e293b]",
    card: "bg-white",
  },
  beauty_soft: {
    surface: "bg-[#fff3f3]",
    accent: "bg-[#d97780]",
    card: "bg-white",
  },
  clinical_clean: {
    surface: "bg-[#eef8fb]",
    accent: "bg-[#0f766e]",
    card: "bg-white",
  },
  pos_classic: {
    surface: "bg-[#eef4ff]",
    accent: "bg-[#1d4ed8]",
    card: "bg-white",
  },
  pos_compact: {
    surface: "bg-[#eef2f7]",
    accent: "bg-[#334155]",
    card: "bg-white",
  },
  pos_touch: {
    surface: "bg-[#fff3e5]",
    accent: "bg-[#c2410c]",
    card: "bg-white",
  },
  wellness_calm: {
    surface: "bg-[#f4f7f1]",
    accent: "bg-[#5f7f52]",
    card: "bg-white",
  },
  modern: {
    surface: "bg-[#f2f5fa]",
    accent: "bg-[#334155]",
    card: "bg-white",
  },
};

const DEFAULT_TEMPLATE_PREVIEW_TONE = {
  surface: "bg-[#f2f5fa]",
  accent: "bg-[#334155]",
  card: "bg-white",
};

const buttonBaseClass =
  "inline-flex min-h-11 items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold";
const primaryButtonClass = `${buttonBaseClass} admin-primary w-full disabled:opacity-50 sm:w-auto`;
const secondaryButtonClass =
  `${buttonBaseClass} admin-secondary w-full disabled:opacity-50 sm:w-auto`;
const utilityButtonClass =
  `${buttonBaseClass} admin-secondary w-full disabled:opacity-50 lg:w-auto`;
const DRAFT_STORAGE_KEY_PREFIX = "capture-setup-draft:";

function normalizeBusinessType(value?: string | null) {
  return value?.trim().toLowerCase().replace(/\s+/g, "_") ?? "general";
}

function createEmptyServiceOption(sortOrder: number) {
  return {
    name: "",
    description: "",
    price: 0,
    sortOrder,
    metadata: null,
  };
}

function createEmptyCategory(sortOrder: number): QuoteServiceCategoryInput {
  return {
    name: "",
    description: "",
    multiSelect: false,
    sortOrder,
    metadata: null,
    options: [createEmptyServiceOption(0)],
  };
}

function createEmptyExtra(sortOrder: number): QuoteExtraOptionInput {
  return {
    name: "",
    description: "",
    price: 0,
    pricingType: ExtraPricingType.FIXED,
    includedQuantity: 0,
    sortOrder,
    metadata: null,
  };
}

function clampMoney(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

function sanitizeConfigForSave(config: OrganizationQuoteConfigInput) {
  const categories = config.categories
    .map((category, categoryIndex) => ({
      ...category,
      name: category.name.trim(),
      description: category.description?.trim() || "",
      sortOrder: categoryIndex,
      options: category.options
        .map((option, optionIndex) => ({
          ...option,
          name: option.name.trim(),
          description: option.description?.trim() || "",
          price: clampMoney(option.price),
          sortOrder: optionIndex,
        }))
        .filter((option) => option.name.length > 0),
    }))
    .filter((category) => category.name.length > 0 && category.options.length > 0);

  const extras = config.extras
    .map((extra, extraIndex) => ({
      ...extra,
      name: extra.name.trim(),
      description: extra.description?.trim() || "",
      price: clampMoney(extra.price),
      includedQuantity:
        extra.pricingType === ExtraPricingType.PER_UNIT
          ? Math.max(0, Math.round(extra.includedQuantity))
          : 0,
      sortOrder: extraIndex,
    }))
    .filter((extra) => extra.name.length > 0);

  return {
    ...config,
    branding: {
      ...config.branding,
      businessName: config.branding.businessName.trim() || "Mi negocio",
      businessType: normalizeBusinessType(config.branding.businessType),
      logoUrl: config.branding.logoUrl.trim(),
      quoteTemplate: config.branding.quoteTemplate || "modern",
      primaryColor: config.branding.primaryColor || "#1f2937",
      secondaryColor: config.branding.secondaryColor || "#fffaf4",
      currency: config.branding.currency || "MXN",
      language: config.branding.language || "es-MX",
    },
    categories,
    extras,
    rules: {
      ...config.rules,
      maxSelectedCategories:
        typeof config.rules.maxSelectedCategories === "number"
          ? config.rules.maxSelectedCategories
          : null,
      maxQuantityPerExtra:
        typeof config.rules.maxQuantityPerExtra === "number"
          ? config.rules.maxQuantityPerExtra
          : null,
      maxTotalSelections:
        typeof config.rules.maxTotalSelections === "number"
          ? config.rules.maxTotalSelections
          : null,
    },
    ui: {
      ...config.ui,
      texts: {
        ...config.ui.texts,
        captureWorkMode: normalizeCaptureWorkMode(config.ui.texts.captureWorkMode),
        businessPhone: (config.ui.texts.businessPhone || "").trim(),
        businessAddress: (config.ui.texts.businessAddress || "").trim(),
      },
    },
  };
}

function hasPendingDraftRows(config: OrganizationQuoteConfigInput) {
  const hasDraftCategory = config.categories.some(
    (category) => category.name.trim().length === 0
  );
  const hasDraftOption = config.categories.some((category) =>
    category.options.some((option) => option.name.trim().length === 0)
  );
  const hasDraftExtra = config.extras.some((extra) => extra.name.trim().length === 0);

  return hasDraftCategory || hasDraftOption || hasDraftExtra;
}

function findBusinessOption(value?: string | null) {
  const normalized = normalizeBusinessType(value);

  return (
    BUSINESS_OPTIONS.find(
      (option) => option.businessType === normalized || option.aliases.includes(normalized)
    ) ?? BUSINESS_OPTIONS[BUSINESS_OPTIONS.length - 1]
  );
}

function getDraftStorageKey(organizationId: string) {
  return `${DRAFT_STORAGE_KEY_PREFIX}${organizationId}`;
}

function readCaptureSetupDraft(
  organizationId: string
): CaptureSetupDraftPayload | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(getDraftStorageKey(organizationId));

    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as CaptureSetupDraftPayload;

    if (
      !parsed ||
      typeof parsed !== "object" ||
      !parsed.config ||
      parsed.config.organizationId !== organizationId
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function writeCaptureSetupDraft(payload: CaptureSetupDraftPayload) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      getDraftStorageKey(payload.config.organizationId),
      JSON.stringify(payload)
    );
  } catch {
    // Ignore local persistence issues; the remote config still exists.
  }
}

function SummaryPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#ddd1bf] bg-[#fffaf2] px-3 py-1 text-xs font-semibold text-slate-700">
      {label}
    </span>
  );
}

function ChecklistRow({
  label,
  description,
  complete,
}: {
  label: string;
  description: string;
  complete: boolean;
}) {
  return (
    <div
      className={`rounded-[22px] border p-4 ${
        complete
          ? "border-emerald-200 bg-emerald-50/80"
          : "border-[#eadfcb] bg-[#fffdfa]"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 inline-flex shrink-0 ${
            complete ? "text-emerald-600" : "text-slate-400"
          }`}
        >
          <CheckCircle2 size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-950">{label}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        </div>
      </div>
    </div>
  );
}

export function QuoteConfigWizardV2({
  initialConfig,
  organizations,
  basePath = "/admin/cotizaciones-v2",
}: QuoteConfigWizardV2Props) {
  const router = useRouter();
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [state, dispatch] = useReducer(
    captureSetupReducer,
    initialConfig,
    createCaptureSetupState
  );
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const config = state.config;
  const activeSectionId = state.activeSectionId;
  const selectedBusiness = findBusinessOption(config.branding.businessType);
  const selectedOrganizationName =
    organizations.find((organization) => organization.id === config.organizationId)?.name ??
    initialConfig.branding.businessName;
  const currentSection =
    CAPTURE_SETUP_SECTIONS.find((section) => section.id === activeSectionId) ??
    CAPTURE_SETUP_SECTIONS[0];
  const currentSectionIndex = CAPTURE_SETUP_SECTIONS.findIndex(
    (section) => section.id === activeSectionId
  );
  const workMode = normalizeCaptureWorkMode(config.ui.texts.captureWorkMode);
  const effectiveLogoUrl = getEffectiveLogoUrl({
    businessType: config.branding.businessType,
    logoUrl: config.branding.logoUrl,
  });
  const namedCategoriesCount = useMemo(
    () => config.categories.filter((category) => category.name.trim().length > 0).length,
    [config.categories]
  );
  const namedServicesCount = useMemo(
    () =>
      config.categories.reduce(
        (total, category) =>
          total + category.options.filter((option) => option.name.trim().length > 0).length,
        0
      ),
    [config.categories]
  );
  const namedExtrasCount = useMemo(
    () => config.extras.filter((extra) => extra.name.trim().length > 0).length,
    [config.extras]
  );
  const hasIncompleteDraftRows = useMemo(() => hasPendingDraftRows(config), [config]);
  const hasIdentityDetails = Boolean(
    config.branding.logoUrl.trim() ||
      config.ui.texts.businessPhone?.trim() ||
      config.ui.texts.businessAddress?.trim()
  );
  const exitPath = basePath.startsWith("/organization-admin")
    ? "/organization-admin"
    : "/admin";

  const sections = useMemo(() => {
    const businessStatus: "empty" | "progress" | "complete" =
      normalizeBusinessType(config.branding.businessType).length > 0 ? "complete" : "empty";
    const catalogStatus: "empty" | "progress" | "complete" =
      namedServicesCount > 0
        ? "complete"
        : namedCategoriesCount > 0 || namedExtrasCount > 0
          ? "progress"
          : "empty";
    const modeStatus: "empty" | "progress" | "complete" = CAPTURE_WORK_MODE_OPTIONS[workMode]
      ? "complete"
      : "empty";
    const identityStatus: "empty" | "progress" | "complete" = hasIdentityDetails
      ? "complete"
      : config.branding.businessName.trim().length > 0
        ? "progress"
        : "empty";
    const activationStatus: "empty" | "progress" | "complete" = config.branding.quoteTemplate
      ? namedServicesCount > 0
        ? "complete"
        : "progress"
      : "empty";

    return CAPTURE_SETUP_SECTIONS.map((section) => ({
      id: section.id,
      label: section.label,
      description: section.description,
      optional: section.optional,
      status:
        section.id === "business"
          ? businessStatus
          : section.id === "catalog"
            ? catalogStatus
            : section.id === "mode"
              ? modeStatus
              : section.id === "identity"
                ? identityStatus
                : activationStatus,
    }));
  }, [
    config.branding.businessName,
    config.branding.businessType,
    config.branding.quoteTemplate,
    hasIdentityDetails,
    namedCategoriesCount,
    namedExtrasCount,
    namedServicesCount,
    workMode,
  ]);

  useEffect(() => {
    const persistedDraft = readCaptureSetupDraft(initialConfig.organizationId);

    dispatch({
      type: "reset",
      config: initialConfig,
      activeSectionId: persistedDraft?.activeSectionId ?? "business",
      lastSavedAt: persistedDraft?.updatedAt ?? Date.now(),
    });

    if (persistedDraft) {
      dispatch({
        type: "restore_draft",
        config: persistedDraft.config,
        activeSectionId: persistedDraft.activeSectionId,
      });
    }
  }, [initialConfig]);

  useEffect(() => {
    writeCaptureSetupDraft({
      activeSectionId,
      config,
      updatedAt: state.lastSavedAt ?? Date.now(),
    });
  }, [activeSectionId, config, state.lastSavedAt]);

  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, []);

  function setConfig(
    updater: (current: OrganizationQuoteConfigInput) => OrganizationQuoteConfigInput
  ) {
    dispatch({
      type: "set_config",
      config: updater(config),
    });
  }

  function goToSection(sectionId: CaptureSetupSectionId) {
    dispatch({
      type: "set_active_section",
      activeSectionId: sectionId,
    });
  }

  function goToNextSection() {
    const nextIndex = Math.min(currentSectionIndex + 1, CAPTURE_SETUP_SECTIONS.length - 1);
    goToSection(CAPTURE_SETUP_SECTIONS[nextIndex].id);
  }

  function goToPreviousSection() {
    const previousIndex = Math.max(currentSectionIndex - 1, 0);
    goToSection(CAPTURE_SETUP_SECTIONS[previousIndex].id);
  }

  function applyBusinessPreset(option: BusinessOption) {
    const presetConfig = buildQuoteConfigInputFromPreset(
      option.preset,
      config.organizationId,
      config.branding.businessName.trim() || selectedOrganizationName
    );

    setConfig((current) => ({
      ...presetConfig,
      organizationId: current.organizationId,
      branding: {
        ...presetConfig.branding,
        businessName: current.branding.businessName.trim() || presetConfig.branding.businessName,
        logoUrl: current.branding.logoUrl.trim(),
        currency: current.branding.currency || presetConfig.branding.currency,
        language: current.branding.language || presetConfig.branding.language,
        quoteTemplate: option.recommendedTemplate,
      },
      ui: {
        ...presetConfig.ui,
        texts: {
          ...presetConfig.ui.texts,
          captureWorkMode: option.defaultWorkMode,
          businessPhone: current.ui.texts.businessPhone || "",
          businessAddress: current.ui.texts.businessAddress || "",
        },
      },
    }));
    setToast({
      message: `Cargamos una base recomendada para ${option.label.toLowerCase()}.`,
      type: "success",
    });
  }

  function restoreRecommendedCatalog() {
    const presetConfig = buildQuoteConfigInputFromPreset(
      selectedBusiness.preset,
      config.organizationId,
      config.branding.businessName.trim() || selectedOrganizationName
    );

    setConfig((current) => ({
      ...current,
      categories: presetConfig.categories,
      extras: presetConfig.extras,
    }));
    setToast({
      message: `Restauramos la base recomendada de ${selectedBusiness.label.toLowerCase()}.`,
      type: "success",
    });
  }

  function updateCategory(
    categoryIndex: number,
    updater: (category: QuoteServiceCategoryInput) => QuoteServiceCategoryInput
  ) {
    setConfig((current) => ({
      ...current,
      categories: current.categories.map((category, index) =>
        index === categoryIndex ? updater(category) : category
      ),
    }));
  }

  function updateCategoryOption(
    categoryIndex: number,
    optionIndex: number,
    updater: (
      option: QuoteServiceCategoryInput["options"][number]
    ) => QuoteServiceCategoryInput["options"][number]
  ) {
    updateCategory(categoryIndex, (category) => ({
      ...category,
      options: category.options.map((option, index) =>
        index === optionIndex ? updater(option) : option
      ),
    }));
  }

  function addCategory() {
    setConfig((current) => ({
      ...current,
      categories: [...current.categories, createEmptyCategory(current.categories.length)],
    }));
  }

  function removeCategory(categoryIndex: number) {
    setConfig((current) => ({
      ...current,
      categories: current.categories.filter((_, index) => index !== categoryIndex),
    }));
  }

  function addOption(categoryIndex: number) {
    updateCategory(categoryIndex, (category) => ({
      ...category,
      options: [...category.options, createEmptyServiceOption(category.options.length)],
    }));
  }

  function removeOption(categoryIndex: number, optionIndex: number) {
    updateCategory(categoryIndex, (category) => ({
      ...category,
      options: category.options.filter((_, index) => index !== optionIndex),
    }));
  }

  function updateExtra(
    extraIndex: number,
    updater: (extra: QuoteExtraOptionInput) => QuoteExtraOptionInput
  ) {
    setConfig((current) => ({
      ...current,
      extras: current.extras.map((extra, index) => (index === extraIndex ? updater(extra) : extra)),
    }));
  }

  function addExtra() {
    setConfig((current) => ({
      ...current,
      extras: [...current.extras, createEmptyExtra(current.extras.length)],
    }));
  }

  function removeExtra(extraIndex: number) {
    setConfig((current) => ({
      ...current,
      extras: current.extras.filter((_, index) => index !== extraIndex),
    }));
  }

  function applyLoadedConfig(nextConfig: OrganizationQuoteConfigInput) {
    const persistedDraft = readCaptureSetupDraft(nextConfig.organizationId);

    dispatch({
      type: "reset",
      config: nextConfig,
      activeSectionId: persistedDraft?.activeSectionId ?? "business",
      lastSavedAt: persistedDraft?.updatedAt ?? Date.now(),
    });

    if (persistedDraft) {
      dispatch({
        type: "restore_draft",
        config: persistedDraft.config,
        activeSectionId: persistedDraft.activeSectionId,
      });
    }
  }

  async function loadOrganizationConfig(organizationId: string) {
    setLoadingConfig(true);

    try {
      const response = await fetch(`/api/quote-config?organizationId=${organizationId}`, {
        method: "GET",
        cache: "no-store",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "No se pudo cargar la configuración");
      }

      applyLoadedConfig(payload);

      startTransition(() => {
        router.push(`${basePath}?organizationId=${organizationId}`);
      });
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Error inesperado",
        type: "error",
      });
    } finally {
      setLoadingConfig(false);
    }
  }

  const saveConfig = useCallback(async function saveConfig({
    message,
    silentSuccess,
    refresh,
  }: {
    message: string;
    silentSuccess: boolean;
    refresh: boolean;
  }) {
    const preparedConfig = sanitizeConfigForSave(config);
    dispatch({ type: "save_start" });

    try {
      const response = await fetch("/api/quote-config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preparedConfig),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "No se pudo guardar la configuración");
      }

      const savedAt = Date.now();
      dispatch({
        type: "save_success",
        config: preparedConfig,
        savedAt,
      });
      writeCaptureSetupDraft({
        activeSectionId,
        config: preparedConfig,
        updatedAt: savedAt,
      });

      if (!silentSuccess) {
        setToast({
          message,
          type: "success",
        });
      }

      if (refresh) {
        router.refresh();
      }

      return true;
    } catch (error) {
      dispatch({ type: "save_error" });
      setToast({
        message: error instanceof Error ? error.message : "Error inesperado",
        type: "error",
      });
      return false;
    }
  }, [activeSectionId, config, router]);

  useEffect(() => {
    if (state.saveStatus !== "dirty" || hasIncompleteDraftRows) {
      return;
    }

    autosaveTimerRef.current = setTimeout(() => {
      void saveConfig({
        message: "Tus cambios quedaron guardados.",
        silentSuccess: true,
        refresh: false,
      });
    }, 1200);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [config, hasIncompleteDraftRows, saveConfig, state.saveStatus]);

  async function uploadLogo(file: File) {
    setUploadingLogo(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("organizationId", config.organizationId);

      const response = await fetch("/api/admin/quote-logo", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "No se pudo subir el logo");
      }

      setConfig((current) => ({
        ...current,
        branding: {
          ...current.branding,
          logoUrl: String(payload.url ?? ""),
        },
      }));
      setToast({
        message: "Logo actualizado correctamente.",
        type: "success",
      });
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Error inesperado",
        type: "error",
      });
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handlePrimaryAction() {
    if (currentSectionIndex === CAPTURE_SETUP_SECTIONS.length - 1) {
      await saveConfig({
        message: "La captura quedó lista para usarse.",
        silentSuccess: false,
        refresh: true,
      });
      return;
    }

    goToNextSection();
  }

  async function handleSaveDraft() {
    await saveConfig({
      message: "Tus cambios quedaron guardados.",
      silentSuccess: false,
      refresh: false,
    });
  }

  async function handleSaveAndExit() {
    if (state.saveStatus === "saving") {
      return;
    }

    const shouldSave =
      state.saveStatus === "dirty" || state.saveStatus === "error" || state.saveStatus === "idle";

    if (shouldSave) {
      const success = await saveConfig({
        message: "Tus cambios quedaron guardados.",
        silentSuccess: false,
        refresh: false,
      });

      if (!success) {
        return;
      }
    }

    startTransition(() => {
      router.push(exitPath);
    });
  }

  function renderBusinessSection() {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {BUSINESS_OPTIONS.map((option) => {
            const active = option.id === selectedBusiness.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => applyBusinessPreset(option)}
                className="rounded-[28px] border p-5 text-left transition sm:p-6"
                style={{
                  borderColor: active ? "#c6a66b" : "#eadfcb",
                  background: active ? "#fffaf2" : "#ffffff",
                  boxShadow: active
                    ? "0 18px 40px rgba(198, 166, 107, 0.14)"
                    : "0 10px 24px rgba(15, 23, 42, 0.04)",
                }}
              >
                <div className="flex items-start gap-4">
                  <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-900 shadow-sm">
                    {option.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-lg font-semibold text-slate-950">{option.label}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{option.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <SummaryPill label={CAPTURE_WORK_MODE_OPTIONS[option.defaultWorkMode].label} />
                      <SummaryPill label={QUOTE_TEMPLATE_OPTIONS[option.recommendedTemplate].label} />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <section className="rounded-[28px] border border-[#eadfcb] bg-[#fffdfa] p-5 sm:p-6">
            <p className="text-sm font-semibold text-slate-950">Lo que vamos a dejar listo</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <SummaryPill label={selectedBusiness.label} />
              <SummaryPill label={`${namedCategoriesCount || config.categories.length} categorías`} />
              <SummaryPill label={`${namedServicesCount} servicios`} />
              <SummaryPill label={`${namedExtrasCount} extras`} />
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Si cambias de giro aquí, recargamos servicios, extras, estilo visual y la forma de
              trabajo recomendada para ayudarte a empezar rápido.
            </p>
          </section>

          <section className="rounded-[28px] border border-[#eadfcb] bg-white p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff7eb] text-slate-900 shadow-sm">
                <CheckCircle2 size={20} />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-950">Sin miedo a elegir</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Todo esto lo puedes cambiar después. Aquí solo estamos dejando un punto de partida
                  práctico para cobrar, agendar o cotizar desde hoy.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  function renderCatalogSection() {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <SummaryPill label={`${namedCategoriesCount || config.categories.length} categorías`} />
          <SummaryPill label={`${namedServicesCount} servicios`} />
          <SummaryPill label={`${namedExtrasCount} extras rápidos`} />
        </div>

        <section className="rounded-[28px] border border-[#eadfcb] bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">Servicios principales</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Piensa en lo que más vendes o haces todos los días. No hace falta dejarlo perfecto
                para empezar.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={restoreRecommendedCatalog} className={secondaryButtonClass}>
                Restaurar recomendados
              </button>
              <button type="button" onClick={addCategory} className={secondaryButtonClass}>
                <Plus size={18} className="mr-2" />
                Agregar categoría
              </button>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {config.categories.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-[#d7c8b0] bg-[#fffdfa] p-5 text-sm leading-6 text-slate-600">
                Todavía no hay servicios cargados. Puedes dejarlo así por ahora o agregar una
                categoría rápida.
              </div>
            ) : null}

            {config.categories.map((category, categoryIndex) => (
              <div
                key={`${category.id ?? "category"}-${categoryIndex}`}
                className="rounded-[28px] border border-[#eadfcb] bg-[#fffdfa] p-4 shadow-[0_10px_24px_rgba(15,23,42,0.03)] sm:p-5"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="grid flex-1 gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
                    <label className="space-y-2">
                      <span className="admin-label block text-sm font-medium">Categoría</span>
                      <input
                        value={category.name}
                        onChange={(event) =>
                          updateCategory(categoryIndex, (current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                        placeholder="Ej. Corte, Consulta, Diagnóstico"
                        className="admin-input px-4 py-3 text-sm"
                      />
                    </label>

                    <div className="space-y-2">
                      <span className="admin-label block text-sm font-medium">
                        ¿Se puede elegir varios?
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            updateCategory(categoryIndex, (current) => ({
                              ...current,
                              multiSelect: false,
                            }))
                          }
                          className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                            !category.multiSelect
                              ? "border-[#c6a66b] bg-[#fffaf2] text-slate-950"
                              : "border-[#eadfcb] bg-white text-slate-600"
                          }`}
                        >
                          Uno
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateCategory(categoryIndex, (current) => ({
                              ...current,
                              multiSelect: true,
                            }))
                          }
                          className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                            category.multiSelect
                              ? "border-[#c6a66b] bg-[#fffaf2] text-slate-950"
                              : "border-[#eadfcb] bg-white text-slate-600"
                          }`}
                        >
                          Varios
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeCategory(categoryIndex)}
                    className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-600"
                  >
                    <Trash2 size={16} className="mr-2" />
                    Quitar categoría
                  </button>
                </div>

                <div className="mt-5 space-y-3">
                  {category.options.map((option, optionIndex) => (
                    <div
                      key={`${option.id ?? "option"}-${optionIndex}`}
                      className="grid gap-3 rounded-[22px] border border-[#efe6d8] bg-white p-3 lg:grid-cols-[minmax(0,1fr)_160px_auto]"
                    >
                      <label className="space-y-2">
                        <span className="admin-label block text-xs font-semibold uppercase tracking-[0.14em]">
                          Servicio
                        </span>
                        <input
                          value={option.name}
                          onChange={(event) =>
                            updateCategoryOption(categoryIndex, optionIndex, (current) => ({
                              ...current,
                              name: event.target.value,
                            }))
                          }
                          placeholder="Ej. Corte clásico, Consulta inicial"
                          className="admin-input px-4 py-3 text-sm"
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="admin-label block text-xs font-semibold uppercase tracking-[0.14em]">
                          Precio
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={option.price}
                          onChange={(event) =>
                            updateCategoryOption(categoryIndex, optionIndex, (current) => ({
                              ...current,
                              price: Number(event.target.value),
                            }))
                          }
                          className="admin-input px-4 py-3 text-sm"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => removeOption(categoryIndex, optionIndex)}
                        className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#eadfcb] px-4 py-3 text-sm font-semibold text-slate-600"
                      >
                        <Trash2 size={16} className="mr-2" />
                        Quitar
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addOption(categoryIndex)}
                    className={secondaryButtonClass}
                  >
                    <Plus size={18} className="mr-2" />
                    Agregar servicio
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-[#eadfcb] bg-white p-5 sm:p-6">
          <div>
            <div>
              <h3 className="text-lg font-semibold text-slate-950">Extras rápidos</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Úsalos para toppings, materiales, urgencias o cargos que se agregan aparte.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {config.extras.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-[#d7c8b0] bg-[#fffdfa] p-5 text-sm leading-6 text-slate-600">
                No hay extras todavía. Puedes saltarte esto o dejar uno listo para subir el ticket.
              </div>
            ) : null}

            {config.extras.map((extra, extraIndex) => (
              <div
                key={`${extra.id ?? "extra"}-${extraIndex}`}
                className="grid gap-3 rounded-[24px] border border-[#eadfcb] bg-[#fffdfa] p-4 lg:grid-cols-[minmax(0,1fr)_160px_220px_auto]"
              >
                <label className="space-y-2">
                  <span className="admin-label block text-xs font-semibold uppercase tracking-[0.14em]">
                    Extra
                  </span>
                  <input
                    value={extra.name}
                    onChange={(event) =>
                      updateExtra(extraIndex, (current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Ej. Urgencia, Queso extra, Refacción"
                    className="admin-input px-4 py-3 text-sm"
                  />
                </label>

                <label className="space-y-2">
                  <span className="admin-label block text-xs font-semibold uppercase tracking-[0.14em]">
                    Precio
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={extra.price}
                    onChange={(event) =>
                      updateExtra(extraIndex, (current) => ({
                        ...current,
                        price: Number(event.target.value),
                      }))
                    }
                    className="admin-input px-4 py-3 text-sm"
                  />
                </label>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <label className="space-y-2">
                    <span className="admin-label block text-xs font-semibold uppercase tracking-[0.14em]">
                      Se cobra
                    </span>
                    <select
                      value={extra.pricingType}
                      onChange={(event) =>
                        updateExtra(extraIndex, (current) => ({
                          ...current,
                          pricingType:
                            event.target.value === ExtraPricingType.PER_UNIT
                              ? ExtraPricingType.PER_UNIT
                              : ExtraPricingType.FIXED,
                          includedQuantity:
                            event.target.value === ExtraPricingType.PER_UNIT
                              ? current.includedQuantity
                              : 0,
                        }))
                      }
                      className="admin-input px-4 py-3 text-sm"
                    >
                      <option value={ExtraPricingType.FIXED}>Como cargo fijo</option>
                      <option value={ExtraPricingType.PER_UNIT}>Por pieza o unidad</option>
                    </select>
                  </label>

                  {extra.pricingType === ExtraPricingType.PER_UNIT ? (
                    <label className="space-y-2">
                      <span className="admin-label block text-xs font-semibold uppercase tracking-[0.14em]">
                        Incluye sin costo
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={extra.includedQuantity}
                        onChange={(event) =>
                          updateExtra(extraIndex, (current) => ({
                            ...current,
                            includedQuantity: Number(event.target.value),
                          }))
                        }
                        className="admin-input px-4 py-3 text-sm"
                      />
                    </label>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => removeExtra(extraIndex)}
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#eadfcb] px-4 py-3 text-sm font-semibold text-slate-600"
                >
                  <Trash2 size={16} className="mr-2" />
                  Quitar
                </button>
              </div>
            ))}

            <div className="pt-1">
              <button type="button" onClick={addExtra} className={secondaryButtonClass}>
                <Plus size={18} className="mr-2" />
                Agregar extra
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  function renderModeSection() {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-3">
          {Object.entries(CAPTURE_WORK_MODE_OPTIONS).map(([value, option]) => {
            const active = workMode === value;

            return (
              <button
                key={value}
                type="button"
                onClick={() =>
                  setConfig((current) => ({
                    ...current,
                    ui: {
                      ...current.ui,
                      texts: {
                        ...current.ui.texts,
                        captureWorkMode: value,
                      },
                    },
                  }))
                }
                className="rounded-[28px] border p-5 text-left transition sm:p-6"
                style={{
                  borderColor: active ? "#c6a66b" : "#eadfcb",
                  background: active ? "#fffaf2" : "#ffffff",
                  boxShadow: active
                    ? "0 18px 40px rgba(198, 166, 107, 0.14)"
                    : "0 10px 24px rgba(15, 23, 42, 0.04)",
                }}
              >
                <div className="flex items-start gap-4">
                  <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-900 shadow-sm">
                    {value === "scheduled" ? (
                      <CalendarClock size={20} />
                    ) : value === "walk_in" ? (
                      <ClipboardList size={20} />
                    ) : (
                      <Store size={20} />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-lg font-semibold text-slate-950">{option.label}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{option.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <section className="rounded-[28px] border border-[#eadfcb] bg-[#fffdfa] p-5 sm:p-6">
          <p className="text-sm font-semibold text-slate-950">Así abrirá la captura</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div
              className={`rounded-3xl border p-4 ${
                workMode === "walk_in" || workMode === "hybrid"
                  ? "border-[#c6a66b] bg-[#fffaf2]"
                  : "border-[#eadfcb] bg-white"
              }`}
            >
              <p className="font-semibold text-slate-950">Cobrar ahora</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                La opción más visible para ventas y atenciones del momento.
              </p>
            </div>
            <div
              className={`rounded-3xl border p-4 ${
                workMode === "scheduled" || workMode === "hybrid"
                  ? "border-[#c6a66b] bg-[#fffaf2]"
                  : "border-[#eadfcb] bg-white"
              }`}
            >
              <p className="font-semibold text-slate-950">Agendar</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Ideal cuando casi todo entra por cita o por seguimiento.
              </p>
            </div>
            <div className="rounded-3xl border border-[#eadfcb] bg-white p-4">
              <p className="font-semibold text-slate-950">Hacer cotización</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Siempre queda disponible para propuestas o trabajos que se cierran después.
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  function renderIdentitySection() {
    return (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
        <section className="rounded-[28px] border border-[#eadfcb] bg-white p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">Lo básico del negocio</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Esto ayuda a que la captura y los documentos se sientan más tuyos, pero no bloquea
                la operación.
              </p>
            </div>
            <SummaryPill label="Opcional" />
          </div>

          <div className="mt-5 space-y-4">
            <label className="space-y-2">
              <span className="admin-label block text-sm font-medium">Nombre del negocio</span>
              <input
                value={config.branding.businessName}
                onChange={(event) =>
                  setConfig((current) => ({
                    ...current,
                    branding: {
                      ...current.branding,
                      businessName: event.target.value,
                    },
                  }))
                }
                placeholder="Ej. Consultorio Luna"
                className="admin-input px-4 py-3 text-sm"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="admin-label flex items-center gap-2 text-sm font-medium">
                  <Phone size={16} />
                  Teléfono
                </span>
                <input
                  value={config.ui.texts.businessPhone || ""}
                  onChange={(event) =>
                    setConfig((current) => ({
                      ...current,
                      ui: {
                        ...current.ui,
                        texts: {
                          ...current.ui.texts,
                          businessPhone: event.target.value,
                        },
                      },
                    }))
                  }
                  placeholder="Opcional"
                  className="admin-input px-4 py-3 text-sm"
                />
              </label>

              <label className="space-y-2">
                <span className="admin-label flex items-center gap-2 text-sm font-medium">
                  <MapPin size={16} />
                  Dirección
                </span>
                <input
                  value={config.ui.texts.businessAddress || ""}
                  onChange={(event) =>
                    setConfig((current) => ({
                      ...current,
                      ui: {
                        ...current.ui,
                        texts: {
                          ...current.ui.texts,
                          businessAddress: event.target.value,
                        },
                      },
                    }))
                  }
                  placeholder="Opcional"
                  className="admin-input px-4 py-3 text-sm"
                />
              </label>
            </div>

            <div className="rounded-[24px] border border-[#efe6d8] bg-[#fffdfa] p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-3xl border border-[#eadfcb] bg-white">
                    {effectiveLogoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={effectiveLogoUrl}
                        alt={config.branding.businessName || "Logo"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Store size={22} className="text-slate-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-950">Logo</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Si todavía no lo tienes, no pasa nada. Puedes seguir así.
                    </p>
                  </div>
                </div>

                <label className={`${secondaryButtonClass} cursor-pointer`}>
                  <ImagePlus size={18} className="mr-2" />
                  {uploadingLogo ? "Subiendo..." : "Subir logo"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingLogo}
                    onChange={(event) => {
                      const file = event.target.files?.[0];

                      if (file) {
                        void uploadLogo(file);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-[#eadfcb] bg-[#fffdfa] p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-900 shadow-sm">
              <CheckCircle2 size={20} />
            </span>
            <div>
              <h3 className="text-lg font-semibold text-slate-950">Vista rápida</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Así se verá la identidad básica que acompaña tu operación.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-[#eadfcb] bg-white p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-3xl border border-[#eadfcb] bg-[#fffaf4]">
                {effectiveLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={effectiveLogoUrl}
                    alt={config.branding.businessName || "Logo"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Store size={18} className="text-slate-500" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-slate-950">
                  {config.branding.businessName || selectedOrganizationName}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {config.ui.texts.businessPhone?.trim() || "Sin teléfono todavía"}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {config.ui.texts.businessAddress?.trim() || "Sin dirección todavía"}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  function renderActivationSection() {
    return (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <section className="rounded-[28px] border border-[#eadfcb] bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">Estilo visual</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Si no quieres pensarle, deja el recomendado. Si quieres un look más marcado, cámbialo aquí.
              </p>
            </div>
            <SummaryPill label={`Recomendado: ${QUOTE_TEMPLATE_OPTIONS[selectedBusiness.recommendedTemplate].label}`} />
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {TEMPLATE_STYLE_OPTIONS.map((option) => {
              const active = config.branding.quoteTemplate === option.id;
              const recommended = selectedBusiness.recommendedTemplate === option.id;
              const tone = TEMPLATE_PREVIEW_TONES[option.id] ?? DEFAULT_TEMPLATE_PREVIEW_TONE;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() =>
                    setConfig((current) => ({
                      ...current,
                      branding: {
                        ...current.branding,
                        quoteTemplate: option.id,
                      },
                    }))
                  }
                  className="rounded-[24px] border p-4 text-left transition"
                  style={{
                    borderColor: active ? "#c6a66b" : "#eadfcb",
                    background: active ? "#fffaf2" : "#ffffff",
                  }}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                      {option.eyebrow}
                    </p>
                    {recommended ? <SummaryPill label="Recomendado" /> : null}
                  </div>

                  <div className={`mt-4 rounded-[20px] border border-white/70 p-3 ${tone.surface}`}>
                    <div className={`h-3 rounded-full ${tone.accent}`} />
                    <div className="mt-3 grid grid-cols-[1.2fr_0.8fr] gap-2">
                      <div className={`rounded-2xl p-3 shadow-sm ${tone.card}`}>
                        <div className="h-2 w-20 rounded-full bg-slate-200" />
                        <div className="mt-3 h-2 w-12 rounded-full bg-slate-100" />
                        <div className="mt-2 h-8 rounded-2xl bg-slate-50" />
                      </div>
                      <div className={`rounded-2xl p-3 shadow-sm ${tone.card}`}>
                        <div className="h-2 w-10 rounded-full bg-slate-200" />
                        <div className={`mt-3 h-12 rounded-2xl ${tone.accent} opacity-80`} />
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 text-base font-semibold text-slate-950">{option.label}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{option.description}</p>
                </button>
              );
            })}
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-[28px] border border-[#eadfcb] bg-[#fffdfa] p-5 sm:p-6">
            <h3 className="text-lg font-semibold text-slate-950">Checklist final</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Esto es lo que ya quedará listo para que tu equipo entre a operar.
            </p>

            <div className="mt-5 space-y-3">
              <ChecklistRow
                label="Giro elegido"
                description={`${selectedBusiness.label} con recomendaciones de arranque y estilo sugerido.`}
                complete
              />
              <ChecklistRow
                label="Catálogo base"
                description={`${namedServicesCount} servicios y ${namedExtrasCount} extras listos para capturar.`}
                complete={namedServicesCount > 0}
              />
              <ChecklistRow
                label="Forma de trabajo"
                description={`${CAPTURE_WORK_MODE_OPTIONS[workMode].label} como punto de arranque en /capturar.`}
                complete
              />
              <ChecklistRow
                label="Datos básicos"
                description={
                  hasIdentityDetails
                    ? "Tu negocio ya tiene al menos contacto o imagen básica."
                    : "Puedes operar sin esto y completarlo después."
                }
                complete={hasIdentityDetails}
              />
            </div>
          </section>

          <section className="rounded-[28px] border border-[#eadfcb] bg-white p-5 sm:p-6">
            <p className="text-sm font-semibold text-slate-950">Así verá el arranque tu equipo</p>
            <div className="mt-4 grid gap-3">
              <div
                className={`rounded-3xl border p-4 ${
                  workMode === "walk_in" || workMode === "hybrid"
                    ? "border-[#c6a66b] bg-[#fffaf2]"
                    : "border-[#eadfcb] bg-[#fffdfa]"
                }`}
              >
                <p className="font-semibold text-slate-950">Cobrar ahora</p>
              </div>
              <div
                className={`rounded-3xl border p-4 ${
                  workMode === "scheduled" || workMode === "hybrid"
                    ? "border-[#c6a66b] bg-[#fffaf2]"
                    : "border-[#eadfcb] bg-[#fffdfa]"
                }`}
              >
                <p className="font-semibold text-slate-950">Agendar</p>
              </div>
              <div className="rounded-3xl border border-[#eadfcb] bg-[#fffdfa] p-4">
                <p className="font-semibold text-slate-950">Hacer cotización</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  const primaryActionLabel =
    currentSectionIndex === CAPTURE_SETUP_SECTIONS.length - 1
      ? state.saveStatus === "saving"
        ? "Guardando..."
        : "Dejar listo"
      : "Siguiente";
  const canSkipCurrentSection = currentSection.optional && currentSectionIndex < CAPTURE_SETUP_SECTIONS.length - 1;

  return (
    <>
      <CaptureSetupShell
        title="Deja lista tu forma de vender en unos minutos"
        description="Piensa en esto como un asistente rápido: elige tu giro, revisa la base y deja lista la captura para cobrar, agendar o cotizar sin sentir que estás llenando un sistema."
        organizationName={selectedOrganizationName}
        organizationSelector={
          <label className="block space-y-2">
            <span className="admin-label block text-xs font-semibold uppercase tracking-[0.16em]">
              Negocio activo
            </span>
            <select
              value={config.organizationId}
              onChange={(event) => void loadOrganizationConfig(event.target.value)}
              disabled={loadingConfig || state.saveStatus === "saving"}
              className="admin-input min-w-[240px] px-4 py-3 text-sm"
            >
              {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </select>
          </label>
        }
        saveIndicator={
          <InlineSaveIndicator status={state.saveStatus} lastSavedAt={state.lastSavedAt} />
        }
        sections={sections}
        activeSectionId={activeSectionId}
        onSectionSelect={goToSection}
        sectionEyebrow={`Sección ${currentSectionIndex + 1} de ${CAPTURE_SETUP_SECTIONS.length}`}
        sectionTitle={currentSection.title}
        sectionDescription={currentSection.description}
        primaryAction={
          <button
            type="button"
            onClick={() => void handlePrimaryAction()}
            disabled={loadingConfig || uploadingLogo || state.saveStatus === "saving"}
            className={primaryButtonClass}
          >
            {primaryActionLabel}
          </button>
        }
        secondaryAction={
          currentSectionIndex > 0 ? (
            <button
              type="button"
              onClick={goToPreviousSection}
              disabled={loadingConfig || state.saveStatus === "saving"}
              className={secondaryButtonClass}
            >
              Atrás
            </button>
          ) : undefined
        }
        utilityAction={
          canSkipCurrentSection ? (
            <button
              type="button"
              onClick={goToNextSection}
              disabled={loadingConfig || state.saveStatus === "saving"}
              className={utilityButtonClass}
            >
              Saltar por ahora
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleSaveDraft()}
              disabled={loadingConfig || uploadingLogo || state.saveStatus === "saving"}
              className={utilityButtonClass}
            >
              Guardar borrador
            </button>
          )
        }
        footerHelperText={currentSection.helperText}
        previewAction={
          <Link href="/capturar" className={secondaryButtonClass}>
            Ver captura
          </Link>
        }
        exitAction={
          <button
            type="button"
            onClick={() => void handleSaveAndExit()}
            disabled={loadingConfig || uploadingLogo || state.saveStatus === "saving"}
            className={secondaryButtonClass}
          >
            Guardar y salir
          </button>
        }
      >
        {activeSectionId === "business" ? renderBusinessSection() : null}
        {activeSectionId === "catalog" ? renderCatalogSection() : null}
        {activeSectionId === "mode" ? renderModeSection() : null}
        {activeSectionId === "identity" ? renderIdentitySection() : null}
        {activeSectionId === "activation" ? renderActivationSection() : null}
      </CaptureSetupShell>

      {toast ? <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} /> : null}
    </>
  );
}
