"use client";

import { ExtraPricingType } from "@prisma/client";
import { BriefcaseBusiness, Eye, PackagePlus, ScanText } from "lucide-react";
import { startTransition, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import Toast from "@/src/components/ui/Toast";
import { QuotationWizardLayout } from "@/src/features/quote-config-admin/components/QuotationWizardLayout";
import { WizardStep } from "@/src/features/quote-config-admin/components/WizardStep";
import {
  getExtraCaptureMode,
  getExtraCaptureModeLabel,
  getExtraSectionHelper,
  getExtraSectionLabel,
  getExtraUnitLabel,
  withExtraCaptureMode,
  withExtraSectionHelper,
  withExtraSectionLabel,
  withExtraUnitLabel,
} from "@/src/features/quote-calculator-v2/lib/extra-display";
import { getEffectiveLogoUrl } from "@/src/features/quote-calculator-v2/lib/logo";
import {
  OrganizationQuoteConfigInput,
  OrganizationQuoteConfigView,
  QUOTE_TEMPLATE_OPTIONS,
  QuoteExtraOptionInput,
  QuoteServiceCategoryInput,
} from "@/src/features/quote-calculator-v2/lib/types";

interface QuoteConfigWizardProps {
  initialConfig: OrganizationQuoteConfigView;
  organizations: Array<{
    id: string;
    name: string;
  }>;
  basePath?: string;
}

const wizardSteps = [
  {
    id: "info",
    label: "Información",
    title: "Paso 1: Datos básicos del negocio",
    description:
      "Configura el nombre, logo, colores y estilo general que verán tus clientes en el resumen final.",
  },
  {
    id: "services",
    label: "Servicios",
    title: "Paso 2: Servicios y categorías",
    description:
      "Organiza tus servicios en categorías claras para que la captura y el resumen sean fáciles de entender.",
  },
  {
    id: "extras",
    label: "Extras",
    title: "Paso 3: Extras y cargos adicionales",
    description:
      "Agrega conceptos opcionales o cargos extra que puedan sumarse al total final.",
  },
  {
    id: "rules",
    label: "Reglas y textos",
    title: "Paso 4: Límites y textos visibles",
    description:
      "Define reglas simples del flujo y personaliza los textos que verá el usuario final.",
  },
  {
    id: "preview",
    label: "Revisión",
    title: "Paso 5: Revisión final",
    description:
      "Confirma qué verá tu equipo, qué verá el cliente y qué se podrá cobrar antes de guardar.",
  },
] as const;

const editableTextFields = [
  ["calculatorTitle", "Título principal"],
  ["calculatorSubtitle", "Subtítulo principal"],
  ["servicesTitle", "Título de servicios"],
  ["extrasTitle", "Título de extras"],
  ["summaryTitle", "Título de resumen"],
  ["emptySummary", "Texto de resumen vacío"],
  ["download", "Texto del botón de descarga"],
  ["reset", "Texto del botón de reinicio"],
] as const;

const buttonBaseClass =
  "inline-flex min-h-11 items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold";
const primaryButtonClass = `${buttonBaseClass} admin-primary w-full disabled:opacity-50 sm:w-auto`;
const secondaryButtonClass = `${buttonBaseClass} admin-secondary w-full disabled:opacity-50 sm:w-auto`;
const secondaryButtonFullClass = `${buttonBaseClass} admin-secondary w-full disabled:opacity-50`;
const utilityButtonClass =
  `${buttonBaseClass} admin-secondary w-full disabled:opacity-50 lg:w-auto lg:px-4 lg:py-2.5`;
const destructiveButtonClass =
  `${buttonBaseClass} w-full border border-rose-200 text-rose-600 xl:w-auto`;
const uploadButtonClass =
  `${buttonBaseClass} admin-secondary w-full cursor-pointer sm:w-auto`;

const reviewCardClass =
  "rounded-[24px] border border-[#e8dece] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)] sm:p-5";
const summaryChipClass =
  "inline-flex items-center rounded-full border border-[#ddd1bf] bg-[#fffaf2] px-3 py-1 text-xs font-semibold text-slate-700";

type ExtraSuggestion = {
  sectionLabel: string;
  unitLabel: string;
  sectionHelper: string;
};

type WizardMode = "quick" | "advanced";

function normalizeBusinessType(value?: string | null) {
  return value?.trim().toLowerCase().replace(/\s+/g, "_") ?? "general";
}

function getExtraSuggestionsForBusinessType(businessType?: string | null): ExtraSuggestion[] {
  const normalized = normalizeBusinessType(businessType);

  switch (normalized) {
    case "manicurist":
    case "nail_salon":
      return [
        {
          sectionLabel: "Tonos extra",
          unitLabel: "tono",
          sectionHelper: "Registra colores adicionales y cobra solo los que excedan lo incluido.",
        },
        {
          sectionLabel: "Decoraciones",
          unitLabel: "uña",
          sectionHelper: "Úsalo para diseños, piedras o detalles que se cobran por uña.",
        },
        {
          sectionLabel: "Aplicaciones especiales",
          unitLabel: "aplicación",
          sectionHelper: "Ideal para dijes, stickers u otros detalles que se agregan uno por uno.",
        },
      ];
    case "barber_shop":
    case "spa":
    case "estetica":
    case "beauty_clinic":
      return [
        {
          sectionLabel: "Aplicaciones extra",
          unitLabel: "aplicación",
          sectionHelper: "Úsalo para ampollas, mascarillas, piedra caliente u otros complementos individuales.",
        },
        {
          sectionLabel: "Productos adicionales",
          unitLabel: "producto",
          sectionHelper: "Agrupa productos o complementos que se cobran uno por uno.",
        },
      ];
    case "mechanic_shop":
    case "auto_body_shop":
    case "electricista":
    case "electrician":
    case "carpinteria":
    case "carpentry":
      return [
        {
          sectionLabel: "Refacciones",
          unitLabel: "pieza",
          sectionHelper: "Registra piezas o materiales adicionales que se cobran por unidad.",
        },
        {
          sectionLabel: "Material adicional",
          unitLabel: "material",
          sectionHelper: "Úsalo para consumibles, cables, tornillería o insumos que se cuentan uno por uno.",
        },
      ];
    case "dentist":
    case "psychologist":
    case "fisioterapeuta":
    case "physiotherapy":
    case "veterinaria":
    case "veterinary":
      return [
        {
          sectionLabel: "Material adicional",
          unitLabel: "pieza",
          sectionHelper: "Úsalo para insumos, materiales o apoyos que se cobran por unidad.",
        },
        {
          sectionLabel: "Complementos",
          unitLabel: "complemento",
          sectionHelper: "Sirve para apoyos o elementos adicionales que se agregan a la atención.",
        },
      ];
    case "car_wash":
      return [
        {
          sectionLabel: "Complementos",
          unitLabel: "aplicación",
          sectionHelper: "Ideal para aromatizante, cera, protección o tratamientos adicionales por aplicación.",
        },
        {
          sectionLabel: "Insumos extra",
          unitLabel: "pieza",
          sectionHelper: "Agrupa accesorios o insumos que se cobran por unidad.",
        },
      ];
    case "hot_dogs":
    case "hamburguesas":
    case "tacos":
    case "flautas":
    case "comida_rapida":
    case "fast_food":
      return [
        {
          sectionLabel: "Toppings",
          unitLabel: "topping",
          sectionHelper: "Registra ingredientes o extras que el cliente puede agregar uno por uno.",
        },
        {
          sectionLabel: "Complementos",
          unitLabel: "extra",
          sectionHelper: "Úsalo para queso extra, proteína adicional, salsas u otros complementos.",
        },
      ];
    default:
      return [
        {
          sectionLabel: "Extras individuales",
          unitLabel: "unidad",
          sectionHelper: "Agrupa conceptos que se registran uno por uno según tu operación.",
        },
        {
          sectionLabel: "Material adicional",
          unitLabel: "pieza",
          sectionHelper: "Úsalo para piezas, insumos o unidades que se agregan al total.",
        },
      ];
  }
}

function createEmptyCategory(sortOrder: number): QuoteServiceCategoryInput {
  return {
    name: "",
    description: "",
    multiSelect: false,
    sortOrder,
    metadata: null,
    options: [
      {
        name: "",
        description: "",
        price: 0,
        sortOrder: 0,
        metadata: null,
      },
    ],
  };
}

function createEmptyExtra(sortOrder: number): QuoteExtraOptionInput {
  return {
    name: "",
    description: "",
    price: 0,
    pricingType: ExtraPricingType.PER_UNIT,
    includedQuantity: 0,
    sortOrder,
    metadata: null,
  };
}

function getPricingTypeCopy(pricingType: ExtraPricingType) {
  return pricingType === ExtraPricingType.FIXED ? "Cargo fijo" : "Por unidad";
}

function getSectionLabelCopy(extra: QuoteExtraOptionInput) {
  return getExtraSectionLabel(extra);
}

function SummaryChip({ label }: { label: string }) {
  return <span className={summaryChipClass}>{label}</span>;
}

function ReviewCard({
  icon,
  eyebrow,
  title,
  description,
  items,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  items: string[];
}) {
  return (
    <div className={reviewCardClass}>
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff7eb] text-slate-900">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {eyebrow}
          </p>
          <h3 className="mt-1 font-poppins text-lg font-semibold text-slate-950">
            {title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm leading-6 text-slate-700">
            <span className="mt-[0.4rem] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-900" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function QuoteConfigWizard({
  initialConfig,
  organizations,
  basePath = "/admin/cotizaciones-v2",
}: QuoteConfigWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [wizardMode, setWizardMode] = useState<WizardMode>("quick");
  const [config, setConfig] = useState<OrganizationQuoteConfigInput>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  useEffect(() => {
    setConfig(initialConfig);
  }, [initialConfig]);

  const currentStep = wizardSteps[step];
  const nextStepLabel = wizardSteps[step + 1]?.label;
  const isAdvancedMode = wizardMode === "advanced";
  const effectiveLogoUrl = getEffectiveLogoUrl({
    businessType: config.branding.businessType,
    logoUrl: config.branding.logoUrl,
  });
  const extraSuggestions = useMemo(
    () => getExtraSuggestionsForBusinessType(config.branding.businessType),
    [config.branding.businessType]
  );

  const summaryStats = useMemo(
    () => ({
      categoryCount: config.categories.length,
      optionCount: config.categories.reduce(
        (total, category) => total + category.options.length,
        0
      ),
      extraCount: config.extras.length,
      individualExtraCount: config.extras.filter(
        (extra) => getExtraCaptureMode(extra) === "individual"
      ).length,
    }),
    [config.categories, config.extras]
  );
  const businessFacingSummary = useMemo(
    () => [
      `${summaryStats.categoryCount} categor${summaryStats.categoryCount === 1 ? "ía" : "ías"} listas para capturar.`,
      `${summaryStats.optionCount} opcion${summaryStats.optionCount === 1 ? "" : "es"} disponibles para registrar, proponer o agendar.`,
      config.rules.maxSelectedCategories
        ? `El equipo podrá activar hasta ${config.rules.maxSelectedCategories} categorías por captura.`
        : "El equipo podrá usar todas las categorías que necesite en una sola captura.",
      summaryStats.individualExtraCount > 0
        ? `${summaryStats.individualExtraCount} extra${summaryStats.individualExtraCount === 1 ? "" : "s"} se capturan por unidades individuales como tonos, uñas o piezas.`
        : "Los extras se capturan como cargos estándar o cantidades generales.",
      summaryStats.extraCount > 0
        ? `${summaryStats.extraCount} extra${summaryStats.extraCount === 1 ? "" : "s"} disponible${summaryStats.extraCount === 1 ? "" : "s"} para subir el ticket.`
        : "No hay extras adicionales; solo se cobrarán los conceptos principales.",
    ],
    [summaryStats, config.rules.maxSelectedCategories]
  );
  const clientFacingSummary = useMemo(
    () => [
      `Título visible: ${config.ui.titles.calculatorTitle || config.branding.businessName || "Sin título personalizado"}.`,
      `Subtítulo visible: ${config.ui.titles.calculatorSubtitle || "No configuraste un subtítulo adicional."}`,
      `Secciones visibles: ${config.ui.titles.servicesTitle || "Servicios"}${summaryStats.extraCount > 0 ? ` y ${config.ui.titles.extrasTitle || "Extras"}` : ""}.`,
      `Acción principal visible: ${config.ui.labels.download || "Descargar resumen"}.`,
    ],
    [
      config.branding.businessName,
      config.ui.labels.download,
      config.ui.titles.calculatorSubtitle,
      config.ui.titles.calculatorTitle,
      config.ui.titles.extrasTitle,
      config.ui.titles.servicesTitle,
      summaryStats.extraCount,
    ]
  );
  const monetizationSummary = useMemo(
    () => [
      `La moneda visible será ${config.branding.currency} y el idioma base ${config.branding.language}.`,
      summaryStats.extraCount > 0
        ? `Los extras se cobrarán como ${config.extras
            .map((extra) => getPricingTypeCopy(extra.pricingType).toLowerCase())
            .filter((value, index, values) => values.indexOf(value) === index)
            .join(" y ")}.`
        : "No hay cargos adicionales configurados todavía.",
      config.rules.maxQuantityPerExtra
        ? `Cada extra podrá usarse hasta ${config.rules.maxQuantityPerExtra} veces.`
        : "No definiste un límite por extra.",
      `Template activo: ${QUOTE_TEMPLATE_OPTIONS[config.branding.quoteTemplate].label}.`,
    ],
    [
      config.branding.currency,
      config.branding.language,
      config.branding.quoteTemplate,
      config.extras,
      config.rules.maxQuantityPerExtra,
      summaryStats.extraCount,
    ]
  );

  function updateTitleText(fieldKey: string, value: string) {
    setConfig((current) => {
      if (fieldKey in current.ui.titles) {
        return {
          ...current,
          ui: {
            ...current.ui,
            titles: {
              ...current.ui.titles,
              [fieldKey]: value,
            },
          },
        };
      }

      if (fieldKey in current.ui.labels) {
        return {
          ...current,
          ui: {
            ...current.ui,
            labels: {
              ...current.ui.labels,
              [fieldKey]: value,
            },
          },
        };
      }

      return {
        ...current,
        ui: {
          ...current.ui,
          texts: {
            ...current.ui.texts,
            [fieldKey]: value,
          },
        },
      };
    });
  }

  function updateExtraAt(
    extraIndex: number,
    updater: (extra: QuoteExtraOptionInput) => QuoteExtraOptionInput
  ) {
    setConfig((current) => ({
      ...current,
      extras: current.extras.map((item, index) =>
        index === extraIndex ? updater(item) : item
      ),
    }));
  }

  function updateExtraMetadataAt(
    extraIndex: number,
    updater: (metadata: QuoteExtraOptionInput["metadata"]) => QuoteExtraOptionInput["metadata"]
  ) {
    updateExtraAt(extraIndex, (extra) => ({
      ...extra,
      metadata: updater(extra.metadata),
    }));
  }

  async function loadOrganizationConfig(organizationId: string) {
    setLoadingConfig(true);

    try {
      const response = await fetch(
        `/api/quote-config?organizationId=${organizationId}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "No se pudo cargar la configuración");
      }

      setConfig(payload);
      setStep(0);
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

  async function saveConfig(message = "Configuración guardada correctamente") {
    setSaving(true);

    try {
      const response = await fetch("/api/quote-config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "No se pudo guardar la configuración");
      }

      setToast({
        message,
        type: "success",
      });
      router.refresh();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Error inesperado",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  }

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
          logoUrl: payload.url,
        },
      }));
      setToast({
        message: "Logo subido correctamente",
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

  function handleContinue() {
    if (step === wizardSteps.length - 1) {
      saveConfig();
      return;
    }

    setStep((current) => Math.min(wizardSteps.length - 1, current + 1));
  }

  return (
    <>
      <QuotationWizardLayout
        title="Configuración guiada de captura"
        description="Sigue los pasos en orden para dejar listo el módulo principal con el que el negocio registra, propone o agenda."
        organizationSelector={
          <div className="space-y-2">
            <label className="admin-label block text-sm font-medium">
              Organización
            </label>
            <select
              value={config.organizationId}
              onChange={(event) => loadOrganizationConfig(event.target.value)}
              disabled={loadingConfig}
              className="admin-input px-4 py-3 text-sm"
            >
              {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </select>
            <p className="admin-muted text-xs leading-5">
              Cambia de organización para editar otra configuración sin salir del módulo.
            </p>
          </div>
        }
        currentStep={step}
        steps={wizardSteps.map((wizardStep) => ({
          id: wizardStep.id,
          label: wizardStep.label,
        }))}
        onStepSelect={setStep}
        footerHelperText={
          step === wizardSteps.length - 1
            ? "Revisa el resumen y guarda cuando estés listo."
            : `Ahora estás en ${currentStep.label.toLowerCase()}. Después seguirás con ${nextStepLabel?.toLowerCase()}.`
        }
        utilityAction={
          <button
            type="button"
            onClick={() => saveConfig("Cambios guardados sin salir del paso actual")}
            disabled={saving}
            className={utilityButtonClass}
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        }
        secondaryAction={
          <button
            type="button"
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            disabled={step === 0}
            className={secondaryButtonFullClass}
          >
            Volver
          </button>
        }
        primaryAction={
          <button
            type="button"
            onClick={handleContinue}
            disabled={saving}
            className={`${buttonBaseClass} admin-primary w-full disabled:opacity-50`}
          >
            {saving
              ? "Guardando..."
              : step === wizardSteps.length - 1
                ? "Guardar configuración"
                : `Continuar a ${nextStepLabel}`}
          </button>
        }
      >
        <section className="rounded-[24px] border border-[#eadfcb] bg-[#fffaf4] p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Forma de configuración
              </p>
              <h2 className="mt-2 font-poppins text-xl font-semibold text-slate-950">
                {isAdvancedMode ? "Configuración avanzada" : "Configuración rápida"}
              </h2>
              <p className="admin-muted mt-2 text-sm leading-6">
                {isAdvancedMode
                  ? "Usa este modo cuando quieras afinar textos, idioma, moneda y detalles más específicos."
                  : "Usa este modo para dejar listo el negocio con lo esencial: identidad, catálogo, extras y revisión final."}
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setWizardMode("quick")}
                className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                  wizardMode === "quick"
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-[#ddd1bf] bg-white text-slate-700"
                }`}
              >
                <span className="block font-semibold">Configuración rápida</span>
                <span className={`mt-1 block text-xs leading-5 ${wizardMode === "quick" ? "text-white/75" : "text-slate-500"}`}>
                  Lo esencial para empezar.
                </span>
              </button>
              <button
                type="button"
                onClick={() => setWizardMode("advanced")}
                className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                  wizardMode === "advanced"
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-[#ddd1bf] bg-white text-slate-700"
                }`}
              >
                <span className="block font-semibold">Configuración avanzada</span>
                <span className={`mt-1 block text-xs leading-5 ${wizardMode === "advanced" ? "text-white/75" : "text-slate-500"}`}>
                  Afinar textos y reglas visibles.
                </span>
              </button>
            </div>
          </div>
        </section>

        {step === 0 ? (
          <WizardStep
            stepNumber={1}
            totalSteps={wizardSteps.length}
            title={wizardSteps[0].title}
            description={wizardSteps[0].description}
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="space-y-2">
                <span className="admin-label block text-sm font-medium">Nombre del negocio</span>
                <input
                  value={config.branding.businessName}
                  onChange={(event) =>
                    setConfig((current) => ({
                      ...current,
                      branding: { ...current.branding, businessName: event.target.value },
                    }))
                  }
                  className="admin-input px-4 py-3 text-sm"
                />
              </label>

              <label className="space-y-2">
                <span className="admin-label block text-sm font-medium">Tipo de negocio</span>
                <input
                  value={config.branding.businessType}
                  onChange={(event) =>
                    setConfig((current) => ({
                      ...current,
                      branding: { ...current.branding, businessType: event.target.value },
                    }))
                  }
                  placeholder="Ejemplo: dentista, spa, nail_salon"
                  className="admin-input px-4 py-3 text-sm"
                />
                <p className="admin-muted text-xs leading-5">
                  Esto ayuda a personalizar nombres y tono del módulo principal según el giro.
                </p>
              </label>

              <div className="space-y-2 lg:col-span-2">
                <span className="admin-label block text-sm font-medium">Logo</span>
                <div className="admin-panel rounded-[24px] p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    {effectiveLogoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={effectiveLogoUrl}
                        alt={config.branding.businessName}
                        className="h-20 w-20 rounded-2xl border border-[#eadfcb] bg-white object-contain p-2"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-dashed border-[#d6c8b3] bg-white text-xs text-slate-500">
                        Sin logo
                      </div>
                    )}

                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="space-y-2">
                        <span className="admin-label block text-sm font-medium">
                          Subir archivo
                        </span>
                        <label className={uploadButtonClass}>
                          Seleccionar imagen
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(event) => {
                              const file = event.target.files?.[0];

                              if (file) {
                                uploadLogo(file);
                              }
                              event.currentTarget.value = "";
                            }}
                          />
                        </label>
                      </div>

                      <label className="space-y-2">
                        <span className="admin-label block text-sm font-medium">
                          URL del logo
                        </span>
                        <input
                          value={config.branding.logoUrl}
                          onChange={(event) =>
                            setConfig((current) => ({
                              ...current,
                              branding: { ...current.branding, logoUrl: event.target.value },
                            }))
                          }
                          placeholder="https://..."
                          className="admin-input px-4 py-3 text-sm"
                        />
                      </label>

                      <p className="admin-muted text-xs leading-5">
                        {uploadingLogo
                          ? "Subiendo imagen..."
                          : "Puedes subir una imagen o pegar una URL para mostrar el logo del negocio."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <label className="space-y-2">
                <span className="admin-label block text-sm font-medium">Color principal</span>
                <div className="flex items-center gap-3 rounded-2xl border border-[#eadfcb] bg-white px-3 py-2">
                  <input
                    type="color"
                    value={config.branding.primaryColor}
                    onChange={(event) =>
                      setConfig((current) => ({
                        ...current,
                        branding: { ...current.branding, primaryColor: event.target.value },
                      }))
                    }
                    className="h-10 w-12 cursor-pointer rounded-xl border border-[#eadfcb] bg-transparent p-0"
                  />
                  <input
                    value={config.branding.primaryColor}
                    onChange={(event) =>
                      setConfig((current) => ({
                        ...current,
                        branding: { ...current.branding, primaryColor: event.target.value },
                      }))
                    }
                    className="admin-input min-w-0 flex-1 border-0 bg-transparent px-0 py-1 text-sm shadow-none focus:ring-0"
                  />
                </div>
                <p className="admin-muted text-xs leading-5">
                  Este color se usará como acento principal en la captura y en la imagen final.
                </p>
              </label>

              <label className="space-y-2">
                <span className="admin-label block text-sm font-medium">Color secundario</span>
                <div className="flex items-center gap-3 rounded-2xl border border-[#eadfcb] bg-white px-3 py-2">
                  <input
                    type="color"
                    value={config.branding.secondaryColor}
                    onChange={(event) =>
                      setConfig((current) => ({
                        ...current,
                        branding: { ...current.branding, secondaryColor: event.target.value },
                      }))
                    }
                    className="h-10 w-12 cursor-pointer rounded-xl border border-[#eadfcb] bg-transparent p-0"
                  />
                  <input
                    value={config.branding.secondaryColor}
                    onChange={(event) =>
                      setConfig((current) => ({
                        ...current,
                        branding: { ...current.branding, secondaryColor: event.target.value },
                      }))
                    }
                    className="admin-input min-w-0 flex-1 border-0 bg-transparent px-0 py-1 text-sm shadow-none focus:ring-0"
                  />
                </div>
                <p className="admin-muted text-xs leading-5">
                  Úsalo para contrastes suaves, fondos o detalles secundarios.
                </p>
              </label>

              <label className="space-y-2">
                <span className="admin-label block text-sm font-medium">Template visual</span>
                <select
                  value={config.branding.quoteTemplate}
                  onChange={(event) =>
                    setConfig((current) => ({
                      ...current,
                      branding: {
                        ...current.branding,
                        quoteTemplate: event.target.value as keyof typeof QUOTE_TEMPLATE_OPTIONS,
                      },
                    }))
                  }
                  className="admin-input px-4 py-3 text-sm"
                >
                  {Object.entries(QUOTE_TEMPLATE_OPTIONS).map(([value, option]) => (
                    <option key={value} value={value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="admin-muted text-xs leading-5">
                  {QUOTE_TEMPLATE_OPTIONS[config.branding.quoteTemplate].description}
                </p>
              </label>

              {isAdvancedMode ? (
                <>
                  <label className="space-y-2">
                    <span className="admin-label block text-sm font-medium">Moneda</span>
                    <input
                      value={config.branding.currency}
                      onChange={(event) =>
                        setConfig((current) => ({
                          ...current,
                          branding: { ...current.branding, currency: event.target.value },
                        }))
                      }
                      className="admin-input px-4 py-3 text-sm"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="admin-label block text-sm font-medium">Idioma</span>
                    <input
                      value={config.branding.language}
                      onChange={(event) =>
                        setConfig((current) => ({
                          ...current,
                          branding: { ...current.branding, language: event.target.value },
                        }))
                      }
                      className="admin-input px-4 py-3 text-sm"
                    />
                  </label>
                </>
              ) : (
                <div className="rounded-[24px] border border-[#eadfcb] bg-white p-4 lg:col-span-2">
                  <p className="text-sm font-semibold text-slate-900">
                    Moneda e idioma quedan listos con la configuración actual
                  </p>
                  <p className="admin-muted mt-2 text-sm leading-6">
                    Si necesitas cambiarlos, puedes hacerlo entrando a configuración avanzada.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <SummaryChip label={config.branding.currency} />
                    <SummaryChip label={config.branding.language} />
                  </div>
                </div>
              )}
            </div>
          </WizardStep>
        ) : null}

        {step === 1 ? (
          <WizardStep
            stepNumber={2}
            totalSteps={wizardSteps.length}
            title={wizardSteps[1].title}
            description={wizardSteps[1].description}
          >
            <div className="space-y-4">
              <div className="rounded-[24px] border border-[#eadfcb] bg-[#fffaf4] p-4">
                <p className="text-sm leading-6 text-slate-700">
                  Piensa cada categoría como una sección visible dentro de la captura. Tu equipo la verá al registrar y tu cliente la reconocerá en el resumen o en la propuesta final.
                </p>
              </div>

              {config.categories.map((category, categoryIndex) => (
                <div key={`${category.id ?? "new"}-${categoryIndex}`} className="admin-panel rounded-[24px] p-4 sm:p-5">
                  <div className="flex flex-col gap-4 border-b border-[#efe6d8] pb-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-slate-950">
                          {category.name || `Categoría ${categoryIndex + 1}`}
                        </p>
                        <SummaryChip
                          label={`${category.options.length} opcion${category.options.length === 1 ? "" : "es"}`}
                        />
                        <SummaryChip
                          label={category.multiSelect ? "Varias opciones" : "Una opción"}
                        />
                      </div>
                      <p className="admin-muted mt-2 text-sm leading-6">
                        {category.description?.trim()
                          ? category.description
                          : "Configura el nombre, la descripción y las opciones que verá el negocio al capturar."}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setConfig((current) => ({
                          ...current,
                          categories: current.categories.filter((_, index) => index !== categoryIndex),
                        }))
                      }
                      className={destructiveButtonClass}
                    >
                      Eliminar categoría
                    </button>
                  </div>

                  <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
                    <div className="grid gap-4 lg:grid-cols-2">
                      <label className="space-y-2">
                        <span className="admin-label block text-sm font-medium">Nombre de categoría</span>
                        <input
                          value={category.name}
                          onChange={(event) =>
                            setConfig((current) => ({
                              ...current,
                              categories: current.categories.map((item, index) =>
                                index === categoryIndex
                                  ? { ...item, name: event.target.value }
                                  : item
                              ),
                            }))
                          }
                          className="admin-input px-4 py-3 text-sm"
                        />
                        <p className="admin-muted text-xs leading-5">
                          Este nombre aparecerá como bloque principal dentro de la captura.
                        </p>
                      </label>

                      <label className="space-y-2">
                        <span className="admin-label block text-sm font-medium">Descripción</span>
                        <input
                          value={category.description ?? ""}
                          onChange={(event) =>
                            setConfig((current) => ({
                              ...current,
                              categories: current.categories.map((item, index) =>
                                index === categoryIndex
                                  ? { ...item, description: event.target.value }
                                  : item
                              ),
                            }))
                          }
                          className="admin-input px-4 py-3 text-sm"
                        />
                        <p className="admin-muted text-xs leading-5">
                          Úsala para explicar cuándo aplica esta categoría o qué incluye.
                        </p>
                      </label>

                      <label className="space-y-2 lg:col-span-2">
                        <span className="admin-label block text-sm font-medium">Permite varias opciones</span>
                        <button
                          type="button"
                          onClick={() =>
                            setConfig((current) => ({
                              ...current,
                              categories: current.categories.map((item, index) =>
                                index === categoryIndex
                                  ? { ...item, multiSelect: !item.multiSelect }
                                  : item
                              ),
                            }))
                          }
                          className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm ${
                            category.multiSelect
                              ? "border-[#cfe2d2] bg-[#f3faf4] text-emerald-700"
                              : "border-[#ddd1bf] bg-[#fffdfa] text-slate-600"
                          }`}
                        >
                          <span>{category.multiSelect ? "Sí, se pueden elegir varias opciones" : "No, solo una opción por categoría"}</span>
                          <span className={`h-6 w-11 rounded-full p-1 ${category.multiSelect ? "bg-emerald-500" : "bg-[#cbbba6]"}`}>
                            <span className={`block h-4 w-4 rounded-full bg-white transition ${category.multiSelect ? "translate-x-5" : "translate-x-0"}`} />
                          </span>
                        </button>
                        <p className="admin-muted text-xs leading-5">
                          Actívalo si esta categoría admite varias opciones al mismo tiempo.
                        </p>
                      </label>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <p className="admin-label text-sm font-medium">Opciones de esta categoría</p>
                    {category.options.map((option, optionIndex) => (
                      <div key={`${option.id ?? "new"}-${optionIndex}`} className="rounded-[22px] border border-[#e9dfd1] bg-white p-4">
                        <div className="flex flex-col gap-3 border-b border-[#f1e9dc] pb-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {option.name || `Opción ${optionIndex + 1}`}
                            </p>
                            <p className="admin-muted mt-1 text-xs leading-5">
                              Así se verá esta opción dentro de la categoría.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setConfig((current) => ({
                                ...current,
                                categories: current.categories.map((item, index) =>
                                  index === categoryIndex
                                    ? {
                                        ...item,
                                        options: item.options.filter((_, entryIndex) => entryIndex !== optionIndex),
                                      }
                                    : item
                                ),
                              }))
                            }
                            className="rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600"
                          >
                            Quitar
                          </button>
                        </div>

                        <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_160px]">
                          <label className="space-y-2">
                            <span className="admin-label block text-xs font-medium">Nombre de la opción</span>
                            <input
                              value={option.name}
                              onChange={(event) =>
                                setConfig((current) => ({
                                  ...current,
                                  categories: current.categories.map((item, index) =>
                                    index === categoryIndex
                                      ? {
                                          ...item,
                                          options: item.options.map((entry, entryIndex) =>
                                            entryIndex === optionIndex
                                              ? { ...entry, name: event.target.value }
                                              : entry
                                          ),
                                        }
                                      : item
                                  ),
                                }))
                              }
                              placeholder="Ejemplo: Limpieza básica"
                              className="admin-input px-4 py-3 text-sm"
                            />
                            <p className="admin-muted text-xs leading-5">
                              Nombre corto que verá el negocio y el cliente.
                            </p>
                          </label>
                          <label className="space-y-2">
                            <span className="admin-label block text-xs font-medium">Descripción visible</span>
                            <input
                              value={option.description ?? ""}
                              onChange={(event) =>
                                setConfig((current) => ({
                                  ...current,
                                  categories: current.categories.map((item, index) =>
                                    index === categoryIndex
                                      ? {
                                          ...item,
                                          options: item.options.map((entry, entryIndex) =>
                                            entryIndex === optionIndex
                                              ? { ...entry, description: event.target.value }
                                              : entry
                                          ),
                                        }
                                      : item
                                  ),
                                }))
                              }
                              placeholder="Explica cuándo o cómo aplica"
                              className="admin-input px-4 py-3 text-sm"
                            />
                            <p className="admin-muted text-xs leading-5">
                              Úsala para aclarar qué incluye o cuándo conviene elegirla.
                            </p>
                          </label>
                          <label className="space-y-2">
                            <span className="admin-label block text-xs font-medium">Precio</span>
                            <input
                              type="number"
                              min="0"
                              value={option.price}
                              onChange={(event) =>
                                setConfig((current) => ({
                                  ...current,
                                  categories: current.categories.map((item, index) =>
                                    index === categoryIndex
                                      ? {
                                          ...item,
                                          options: item.options.map((entry, entryIndex) =>
                                            entryIndex === optionIndex
                                              ? { ...entry, price: Number(event.target.value) || 0 }
                                              : entry
                                          ),
                                        }
                                      : item
                                  ),
                                }))
                              }
                              placeholder="0"
                              className="admin-input px-4 py-3 text-sm"
                            />
                            <p className="admin-muted text-xs leading-5">
                              Se sumará al total cada vez que se elija esta opción.
                            </p>
                          </label>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() =>
                        setConfig((current) => ({
                          ...current,
                          categories: current.categories.map((item, index) =>
                            index === categoryIndex
                              ? {
                                  ...item,
                                  options: [
                                    ...item.options,
                                    {
                                      name: "",
                                      description: "",
                                      price: 0,
                                      sortOrder: item.options.length,
                                      metadata: null,
                                    },
                                  ],
                                }
                              : item
                          ),
                        }))
                      }
                      className={secondaryButtonClass}
                    >
                      Agregar opción
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() =>
                  setConfig((current) => ({
                    ...current,
                    categories: [
                      ...current.categories,
                      createEmptyCategory(current.categories.length),
                    ],
                  }))
                }
                className={primaryButtonClass}
              >
                Agregar categoría
              </button>
            </div>
          </WizardStep>
        ) : null}

        {step === 2 ? (
          <WizardStep
            stepNumber={3}
            totalSteps={wizardSteps.length}
            title={wizardSteps[2].title}
            description={wizardSteps[2].description}
          >
            <div className="space-y-4">
              <div className="rounded-[24px] border border-[#eadfcb] bg-[#fffaf4] p-4">
                <p className="admin-muted text-sm leading-6">
                  Si un extra se cobra por unidad, el cliente podrá aumentar la cantidad. Si es un cargo fijo, se cobrará una sola vez aunque lo activen.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {extraSuggestions.map((suggestion) => (
                    <SummaryChip
                      key={`${suggestion.sectionLabel}-${suggestion.unitLabel}`}
                      label={`${suggestion.sectionLabel} · ${suggestion.unitLabel}`}
                    />
                  ))}
                </div>
                <p className="admin-muted mt-3 text-xs leading-5">
                  Estas son sugerencias para tu rubro. Puedes usarlas tal cual o escribir tus propios nombres.
                </p>
              </div>

              {config.extras.map((extra, extraIndex) => {
                const captureMode = getExtraCaptureMode(extra);
                const unitLabel = getExtraUnitLabel(extra);
                const sectionLabel = getExtraSectionLabel(extra);
                const sectionHelper = getExtraSectionHelper(extra);

                return (
                  <div key={`${extra.id ?? "new"}-${extraIndex}`} className="admin-panel rounded-[24px] p-4 sm:p-5">
                    <div className="flex flex-col gap-3 border-b border-[#efe6d8] pb-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">
                            {extra.name || `Extra ${extraIndex + 1}`}
                          </p>
                          <SummaryChip label={getPricingTypeCopy(extra.pricingType)} />
                          {captureMode === "individual" ? (
                            <>
                              <SummaryChip label={getExtraCaptureModeLabel(captureMode)} />
                              <SummaryChip label={sectionLabel} />
                            </>
                          ) : null}
                          {extra.includedQuantity > 0 ? (
                            <SummaryChip label={`${extra.includedQuantity} sin costo`} />
                          ) : null}
                        </div>
                        <p className="admin-muted mt-2 text-xs leading-5">
                          Configura cuándo se suma este concepto, cómo se captura y cómo lo verá el cliente.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setConfig((current) => ({
                            ...current,
                            extras: current.extras.filter((_, index) => index !== extraIndex),
                          }))
                        }
                        className="rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600"
                      >
                        Quitar
                      </button>
                    </div>

                    <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_140px_180px_160px]">
                      <label className="space-y-2">
                        <span className="admin-label block text-xs font-medium">Nombre del extra</span>
                        <input
                          value={extra.name}
                          onChange={(event) =>
                            updateExtraAt(extraIndex, (item) => ({
                              ...item,
                              name: event.target.value,
                            }))
                          }
                          placeholder="Ejemplo: Recargo nocturno"
                          className="admin-input px-4 py-3 text-sm"
                        />
                        <p className="admin-muted text-xs leading-5">
                          Título corto del cargo adicional.
                        </p>
                      </label>
                      <label className="space-y-2">
                        <span className="admin-label block text-xs font-medium">Descripción visible</span>
                        <input
                          value={extra.description ?? ""}
                          onChange={(event) =>
                            updateExtraAt(extraIndex, (item) => ({
                              ...item,
                              description: event.target.value,
                            }))
                          }
                          placeholder="Explica cuándo se suma"
                          className="admin-input px-4 py-3 text-sm"
                        />
                        <p className="admin-muted text-xs leading-5">
                          Ayuda a que el cliente entienda por qué aparece este extra.
                        </p>
                      </label>
                      <label className="space-y-2">
                        <span className="admin-label block text-xs font-medium">Precio</span>
                        <input
                          type="number"
                          min="0"
                          value={extra.price}
                          onChange={(event) =>
                            updateExtraAt(extraIndex, (item) => ({
                              ...item,
                              price: Number(event.target.value) || 0,
                            }))
                          }
                          placeholder="0"
                          className="admin-input px-4 py-3 text-sm"
                        />
                        <p className="admin-muted text-xs leading-5">
                          Monto que se sumará al total.
                        </p>
                      </label>
                      <label className="space-y-2">
                        <span className="admin-label block text-xs font-medium">Forma de cobro</span>
                        <select
                          value={extra.pricingType}
                          onChange={(event) =>
                            updateExtraAt(extraIndex, (item) => ({
                              ...item,
                              pricingType: event.target.value as ExtraPricingType,
                              includedQuantity:
                                event.target.value === ExtraPricingType.FIXED
                                  ? 0
                                  : item.includedQuantity,
                            }))
                          }
                          className="admin-input px-4 py-3 text-sm"
                        >
                          <option value={ExtraPricingType.PER_UNIT}>Por unidad</option>
                          <option value={ExtraPricingType.FIXED}>Cargo fijo</option>
                        </select>
                        <p className="admin-muted text-xs leading-5">
                          Elige si el monto depende de cantidad o se cobra una sola vez.
                        </p>
                      </label>
                      <label className="space-y-2">
                        <span className="admin-label block text-xs font-medium">Cantidad sin costo</span>
                        <input
                          type="number"
                          min="0"
                          value={extra.includedQuantity}
                          onChange={(event) =>
                            updateExtraAt(extraIndex, (item) => ({
                              ...item,
                              includedQuantity: Number(event.target.value) || 0,
                            }))
                          }
                          placeholder="0"
                          disabled={extra.pricingType === ExtraPricingType.FIXED}
                          className="admin-input px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                        />
                        <p className="admin-muted text-xs leading-5">
                          Úsalo si quieres regalar cierta cantidad antes de empezar a cobrar.
                        </p>
                      </label>
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,240px)_minmax(0,220px)_minmax(0,1fr)]">
                      <label className="rounded-[22px] border border-[#e9dfd1] bg-[#fffdf9] p-4">
                        <span className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={captureMode === "individual"}
                            onChange={(event) => {
                              const enabled = event.target.checked;
                              updateExtraMetadataAt(extraIndex, (metadata) => {
                                let nextMetadata = withExtraCaptureMode(
                                  metadata,
                                  enabled ? "individual" : "standard"
                                );
                                nextMetadata = withExtraSectionLabel(
                                  nextMetadata,
                                  enabled ? sectionLabel : ""
                                );
                                nextMetadata = withExtraSectionHelper(
                                  nextMetadata,
                                  enabled ? sectionHelper : ""
                                );
                                nextMetadata = withExtraUnitLabel(
                                  nextMetadata,
                                  enabled ? unitLabel : ""
                                );
                                return nextMetadata;
                              });
                            }}
                            className="mt-1 h-4 w-4 rounded border-[#d8c7af] text-slate-900"
                          />
                          <span className="space-y-1">
                            <span className="admin-label block text-sm font-medium">
                              Se captura por unidades individuales
                            </span>
                            <span className="admin-muted block text-xs leading-5">
                              Actívalo para tonos, uñas, piezas o conceptos que se cuentan uno por uno.
                            </span>
                          </span>
                        </span>
                      </label>

                      <label className="space-y-2">
                        <span className="admin-label block text-xs font-medium">Nombre de la sección</span>
                        <input
                          value={captureMode === "individual" ? sectionLabel : ""}
                          disabled={captureMode !== "individual"}
                          onChange={(event) =>
                            updateExtraMetadataAt(extraIndex, (metadata) =>
                              withExtraSectionLabel(metadata, event.target.value)
                            )
                          }
                          placeholder="Ejemplo: Tonos extra, Toppings, Refacciones"
                          className="admin-input px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                        />
                        <p className="admin-muted text-xs leading-5">
                          Así agrupas varios extras individuales bajo una misma sección según tu rubro.
                        </p>
                      </label>

                      <label className="space-y-2">
                        <span className="admin-label block text-xs font-medium">Nombre de la unidad</span>
                        <input
                          value={captureMode === "individual" ? unitLabel : ""}
                          disabled={captureMode !== "individual"}
                          onChange={(event) =>
                            updateExtraMetadataAt(extraIndex, (metadata) =>
                              withExtraUnitLabel(metadata, event.target.value)
                            )
                          }
                          placeholder="Ejemplo: tono, uña, pieza"
                          className="admin-input px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                        />
                        <p className="admin-muted text-xs leading-5">
                          Así se explicará la cantidad al cobrar, por ejemplo: 2 tonos o 3 uñas.
                        </p>
                      </label>

                      <label className="space-y-2 lg:col-span-3">
                        <span className="admin-label block text-xs font-medium">Texto de apoyo de la sección</span>
                        <input
                          value={captureMode === "individual" ? sectionHelper : ""}
                          disabled={captureMode !== "individual"}
                          onChange={(event) =>
                            updateExtraMetadataAt(extraIndex, (metadata) =>
                              withExtraSectionHelper(metadata, event.target.value)
                            )
                          }
                          placeholder="Ejemplo: Registra piezas adicionales y cobra solo las que se agreguen."
                          className="admin-input px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                        />
                        <p className="admin-muted text-xs leading-5">
                          Ayuda a explicar esa sección en captura, especialmente si tu rubro no usa términos técnicos.
                        </p>
                      </label>
                    </div>

                    {captureMode === "individual" ? (
                      <div className="mt-4 rounded-[22px] border border-[#e9dfd1] bg-[#fffdf9] p-4">
                        <p className="admin-label text-xs font-medium">Aplicar sugerencia rápida</p>
                        <p className="admin-muted mt-2 text-xs leading-5">
                          Usa una base sugerida para tu rubro y luego ajusta el texto si lo necesitas.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {extraSuggestions.map((suggestion) => (
                            <button
                              key={`${suggestion.sectionLabel}-${suggestion.unitLabel}`}
                              type="button"
                              onClick={() =>
                                updateExtraMetadataAt(extraIndex, (metadata) => {
                                  let nextMetadata = withExtraSectionLabel(
                                    metadata,
                                    suggestion.sectionLabel
                                  );
                                  nextMetadata = withExtraUnitLabel(
                                    nextMetadata,
                                    suggestion.unitLabel
                                  );
                                  nextMetadata = withExtraSectionHelper(
                                    nextMetadata,
                                    suggestion.sectionHelper
                                  );
                                  return nextMetadata;
                                })
                              }
                              className="rounded-full border border-[#ddd1bf] bg-[#fffaf2] px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-950"
                            >
                              {suggestion.sectionLabel} · {suggestion.unitLabel}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() =>
                  setConfig((current) => ({
                    ...current,
                    extras: [
                      ...current.extras,
                      createEmptyExtra(current.extras.length),
                    ],
                  }))
                }
                className={primaryButtonClass}
              >
                Agregar extra
              </button>
            </div>
          </WizardStep>
        ) : null}

        {step === 3 ? (
          <WizardStep
            stepNumber={4}
            totalSteps={wizardSteps.length}
            title={wizardSteps[3].title}
            description={wizardSteps[3].description}
          >
            <div className="space-y-6">
              <div className="rounded-[24px] border border-[#eadfcb] bg-[#fffaf4] p-4">
                <p className="text-sm leading-6 text-slate-700">
                  Aquí defines límites operativos y los textos visibles del módulo. Todo lo que escribas debe ser claro para personas sin experiencia técnica.
                </p>
              </div>

              <div className="admin-panel rounded-[24px] p-4 sm:p-5">
                <div className="grid gap-4 lg:grid-cols-3">
                  <label className="space-y-2">
                    <span className="admin-label block text-sm font-medium">Máximo de categorías activas</span>
                    <input
                      type="number"
                      min="0"
                      value={config.rules.maxSelectedCategories ?? ""}
                      onChange={(event) =>
                        setConfig((current) => ({
                          ...current,
                          rules: {
                            ...current.rules,
                            maxSelectedCategories: event.target.value
                              ? Number(event.target.value)
                              : null,
                          },
                        }))
                      }
                      className="admin-input px-4 py-3 text-sm"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="admin-label block text-sm font-medium">Máximo por extra</span>
                    <input
                      type="number"
                      min="0"
                      value={config.rules.maxQuantityPerExtra ?? ""}
                      onChange={(event) =>
                        setConfig((current) => ({
                          ...current,
                          rules: {
                            ...current.rules,
                            maxQuantityPerExtra: event.target.value
                              ? Number(event.target.value)
                              : null,
                          },
                        }))
                      }
                      className="admin-input px-4 py-3 text-sm"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="admin-label block text-sm font-medium">Máximo total de selecciones</span>
                    <input
                      type="number"
                      min="0"
                      value={config.rules.maxTotalSelections ?? ""}
                      onChange={(event) =>
                        setConfig((current) => ({
                          ...current,
                          rules: {
                            ...current.rules,
                            maxTotalSelections: event.target.value
                              ? Number(event.target.value)
                              : null,
                          },
                        }))
                      }
                      className="admin-input px-4 py-3 text-sm"
                    />
                  </label>
                </div>
              </div>

              {isAdvancedMode ? (
                <div className="admin-panel rounded-[24px] p-4 sm:p-5">
                  <p className="admin-label text-sm font-medium">Textos visibles</p>
                  <p className="admin-muted mt-2 text-sm leading-6">
                    Estos textos son los que verá el cliente o el equipo al usar la captura.
                  </p>
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    {editableTextFields.map(([fieldKey, label]) => (
                      <label key={fieldKey} className="space-y-2">
                        <span className="admin-label block text-sm font-medium">{label}</span>
                        <input
                          value={
                            config.ui.titles[fieldKey] ??
                            config.ui.texts[fieldKey] ??
                            config.ui.labels[fieldKey] ??
                            ""
                          }
                          onChange={(event) => updateTitleText(fieldKey, event.target.value)}
                          className="admin-input px-4 py-3 text-sm"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="admin-panel rounded-[24px] p-4 sm:p-5">
                  <p className="admin-label text-sm font-medium">Textos visibles</p>
                  <p className="admin-muted mt-2 text-sm leading-6">
                    En configuración rápida conservamos los textos actuales para no complicar esta parte del flujo.
                  </p>
                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    <div className="rounded-[22px] border border-[#e9dfd1] bg-[#fffdf9] p-4">
                      <p className="text-sm font-semibold text-slate-900">
                        Lo más importante ya está listo
                      </p>
                      <p className="admin-muted mt-2 text-sm leading-6">
                        Título principal, títulos de secciones y botón principal seguirán usando tu configuración actual.
                      </p>
                    </div>
                    <div className="rounded-[22px] border border-[#e9dfd1] bg-[#fffdf9] p-4">
                      <p className="text-sm font-semibold text-slate-900">
                        ¿Necesitas afinar el lenguaje?
                      </p>
                      <p className="admin-muted mt-2 text-sm leading-6">
                        Cambia a configuración avanzada si quieres personalizar cada texto visible para tu rubro.
                      </p>
                      <button
                        type="button"
                        onClick={() => setWizardMode("advanced")}
                        className="admin-secondary mt-4 px-4 py-2.5 text-sm font-semibold"
                      >
                        Ir a configuración avanzada
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </WizardStep>
        ) : null}

        {step === 4 ? (
          <WizardStep
            stepNumber={5}
            totalSteps={wizardSteps.length}
            title={wizardSteps[4].title}
            description={wizardSteps[4].description}
          >
            <div className="space-y-5">
              <div className="grid gap-4 xl:grid-cols-3">
                <ReviewCard
                  icon={<BriefcaseBusiness size={20} />}
                  eyebrow="Lo verá tu negocio"
                  title="Equipo y operación"
                  description="Esto define cómo trabajará tu equipo al capturar una venta, servicio o atención."
                  items={businessFacingSummary}
                />
                <ReviewCard
                  icon={<Eye size={20} />}
                  eyebrow="Lo verá tu cliente"
                  title="Textos e imagen"
                  description="Esto es lo que el cliente reconocerá al revisar la propuesta o el resumen final."
                  items={clientFacingSummary}
                />
                <ReviewCard
                  icon={<PackagePlus size={20} />}
                  eyebrow="Lo que podrás cobrar"
                  title="Servicios y extras"
                  description="Aquí confirmas si el flujo está listo para vender, cobrar y crecer el ticket."
                  items={monetizationSummary}
                />
              </div>

              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
                <div className="space-y-5">
                  <div className={reviewCardClass}>
                    <p className="admin-label text-sm font-medium">Identidad visual</p>
                    <h3 className="mt-2 font-poppins text-xl font-semibold text-slate-950">
                      {config.branding.businessName}
                    </h3>
                    <p className="admin-muted mt-2 text-sm leading-6">
                      {config.ui.titles.calculatorSubtitle || "Sin subtítulo configurado"}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <div
                        className="h-12 w-12 rounded-2xl border"
                        style={{ backgroundColor: config.branding.primaryColor }}
                        title={`Color principal ${config.branding.primaryColor}`}
                      />
                      <div
                        className="h-12 w-12 rounded-2xl border"
                        style={{ backgroundColor: config.branding.secondaryColor }}
                        title={`Color secundario ${config.branding.secondaryColor}`}
                      />
                      <SummaryChip label={QUOTE_TEMPLATE_OPTIONS[config.branding.quoteTemplate].label} />
                      <SummaryChip label={config.branding.currency} />
                      <SummaryChip label={config.branding.language} />
                    </div>
                  </div>

                  <div className={reviewCardClass}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="admin-label text-sm font-medium">Categorías y opciones</p>
                        <p className="admin-muted mt-2 text-sm leading-6">
                          Revisa cómo quedará organizado el catálogo principal dentro de la captura.
                        </p>
                      </div>
                      <SummaryChip label={`${summaryStats.categoryCount} categorías`} />
                    </div>

                    <div className="mt-4 space-y-3">
                      {config.categories.map((category, categoryIndex) => (
                        <div
                          key={category.id ?? `${category.name}-${categoryIndex}`}
                          className="rounded-[22px] border border-[#e9dfd1] bg-[#fffdf9] p-4"
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900">
                                {category.name || `Categoría ${categoryIndex + 1}`}
                              </p>
                              <p className="admin-muted mt-1 text-sm leading-6">
                                {category.description || "Sin descripción visible"}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <SummaryChip
                                label={`${category.options.length} opcion${category.options.length === 1 ? "" : "es"}`}
                              />
                              <SummaryChip
                                label={category.multiSelect ? "Varias opciones" : "Una opción"}
                              />
                            </div>
                          </div>

                          <ul className="mt-3 space-y-1 text-sm text-slate-700">
                            {category.options.slice(0, 4).map((option, optionIndex) => (
                              <li key={option.id ?? `${option.name}-${optionIndex}`}>
                                {option.name || `Opción ${optionIndex + 1}`} · {config.branding.currency} {option.price}
                              </li>
                            ))}
                            {category.options.length > 4 ? (
                              <li className="admin-muted">
                                Y {category.options.length - 4} opción{category.options.length - 4 === 1 ? "" : "es"} más.
                              </li>
                            ) : null}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <aside className="space-y-5">
                  <div className={reviewCardClass}>
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff7eb] text-slate-900">
                        <ScanText size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="admin-label text-sm font-medium">Textos que verá el cliente</p>
                        <div className="mt-3 space-y-3 text-sm text-slate-700">
                          <p>
                            <span className="font-semibold text-slate-900">Título principal:</span>{" "}
                            {config.ui.titles.calculatorTitle || "Sin título configurado"}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-900">Título de servicios:</span>{" "}
                            {config.ui.titles.servicesTitle || "Servicios"}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-900">Título de extras:</span>{" "}
                            {config.ui.titles.extrasTitle || "Extras"}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-900">Botón principal:</span>{" "}
                            {config.ui.labels.download || "Descargar resumen"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={reviewCardClass}>
                    <p className="admin-label text-sm font-medium">Extras y cargos</p>
                    <div className="mt-4 space-y-3">
                      {config.extras.length > 0 ? (
                        config.extras.map((extra, extraIndex) => (
                          <div
                            key={extra.id ?? `${extra.name}-${extraIndex}`}
                            className="rounded-[22px] border border-[#e9dfd1] bg-[#fffdf9] p-4"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-slate-900">
                                {extra.name || `Extra ${extraIndex + 1}`}
                              </p>
                              <SummaryChip label={getPricingTypeCopy(extra.pricingType)} />
                              {getExtraCaptureMode(extra) === "individual" ? (
                                <>
                                  <SummaryChip label={getExtraCaptureModeLabel(getExtraCaptureMode(extra))} />
                                  <SummaryChip label={getSectionLabelCopy(extra)} />
                                </>
                              ) : null}
                            </div>
                            <p className="admin-muted mt-2 text-sm leading-6">
                              {extra.description || "Sin descripción visible"}
                            </p>
                            <p className="mt-2 text-sm text-slate-700">
                              {config.branding.currency} {extra.price}
                              {extra.includedQuantity > 0
                                ? ` · ${extra.includedQuantity} sin costo`
                                : ""}
                            </p>
                            {getExtraCaptureMode(extra) === "individual" ? (
                              <p className="admin-muted mt-2 text-xs leading-5">
                                Se captura como {getExtraUnitLabel(extra)} individual dentro de {getSectionLabelCopy(extra).toLowerCase()}.
                              </p>
                            ) : null}
                          </div>
                        ))
                      ) : (
                        <div className="rounded-[22px] border border-dashed border-[#e9dfd1] bg-[#fffdf9] p-4 text-sm text-slate-700">
                          Aún no configuraste extras. El flujo cobrará solo servicios principales.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-[#eadfcb] bg-[#fffaf4] p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Todo listo para guardar
                    </p>
                    <p className="admin-muted mt-2 text-sm leading-6">
                      Si este resumen coincide con lo que debe ver el negocio y el cliente, ya puedes guardar esta configuración y usarla en captura.
                    </p>
                  </div>
                </aside>
              </div>
            </div>
          </WizardStep>
        ) : null}
      </QuotationWizardLayout>

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
