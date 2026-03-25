"use client";

import { ExtraPricingType } from "@prisma/client";
import { startTransition, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import Toast from "@/src/components/ui/Toast";
import { QuotationWizardLayout } from "@/src/features/quote-config-admin/components/QuotationWizardLayout";
import { WizardStep } from "@/src/features/quote-config-admin/components/WizardStep";
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
      "Configura el nombre, logo, colores y estilo general que verán tus clientes en la cotización.",
  },
  {
    id: "services",
    label: "Servicios",
    title: "Paso 2: Servicios y categorías",
    description:
      "Organiza tus servicios en categorías claras para que la cotización sea fácil de entender.",
  },
  {
    id: "extras",
    label: "Extras",
    title: "Paso 3: Extras y cargos adicionales",
    description:
      "Agrega conceptos opcionales o cargos extra que puedan sumarse a la cotización.",
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
      "Revisa el resumen completo antes de guardar la configuración de esta organización.",
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

export function QuoteConfigWizard({
  initialConfig,
  organizations,
  basePath = "/admin/cotizaciones-v2",
}: QuoteConfigWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
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
  const effectiveLogoUrl = getEffectiveLogoUrl({
    businessType: config.branding.businessType,
    logoUrl: config.branding.logoUrl,
  });

  const summaryStats = useMemo(
    () => ({
      categoryCount: config.categories.length,
      optionCount: config.categories.reduce(
        (total, category) => total + category.options.length,
        0
      ),
      extraCount: config.extras.length,
    }),
    [config.categories, config.extras]
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
        title="Configuración guiada de cotizaciones"
        description="Sigue los pasos en orden para dejar lista la experiencia de cotización de tu negocio."
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

                      <input
                        value={config.branding.logoUrl}
                        onChange={(event) =>
                          setConfig((current) => ({
                            ...current,
                            branding: { ...current.branding, logoUrl: event.target.value },
                          }))
                        }
                        placeholder="URL del logo"
                        className="admin-input px-4 py-3 text-sm"
                      />

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
              {config.categories.map((category, categoryIndex) => (
                <div key={`${category.id ?? "new"}-${categoryIndex}`} className="admin-panel rounded-[24px] p-4 sm:p-5">
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
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
                          <span>{category.multiSelect ? "Sí, el cliente puede elegir varias opciones" : "No, solo una opción por categoría"}</span>
                          <span className={`h-6 w-11 rounded-full p-1 ${category.multiSelect ? "bg-emerald-500" : "bg-[#cbbba6]"}`}>
                            <span className={`block h-4 w-4 rounded-full bg-white transition ${category.multiSelect ? "translate-x-5" : "translate-x-0"}`} />
                          </span>
                        </button>
                      </label>
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

                  <div className="mt-6 space-y-3">
                    <p className="admin-label text-sm font-medium">Opciones de esta categoría</p>
                    {category.options.map((option, optionIndex) => (
                      <div key={`${option.id ?? "new"}-${optionIndex}`} className="rounded-2xl border border-[#e9dfd1] bg-white p-4">
                        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_140px_auto]">
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
                            placeholder="Nombre"
                            className="admin-input px-4 py-3 text-sm"
                          />
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
                            placeholder="Descripción"
                            className="admin-input px-4 py-3 text-sm"
                          />
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
                            placeholder="Precio"
                            className="admin-input px-4 py-3 text-sm"
                          />
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
                            className={destructiveButtonClass}
                          >
                            Quitar
                          </button>
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
              </div>

              {config.extras.map((extra, extraIndex) => (
                <div key={`${extra.id ?? "new"}-${extraIndex}`} className="admin-panel rounded-[24px] p-4 sm:p-5">
                  <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_140px_180px_160px_auto]">
                    <input
                      value={extra.name}
                      onChange={(event) =>
                        setConfig((current) => ({
                          ...current,
                          extras: current.extras.map((item, index) =>
                            index === extraIndex ? { ...item, name: event.target.value } : item
                          ),
                        }))
                      }
                      placeholder="Nombre"
                      className="admin-input px-4 py-3 text-sm"
                    />
                    <input
                      value={extra.description ?? ""}
                      onChange={(event) =>
                        setConfig((current) => ({
                          ...current,
                          extras: current.extras.map((item, index) =>
                            index === extraIndex
                              ? { ...item, description: event.target.value }
                              : item
                          ),
                        }))
                      }
                      placeholder="Descripción"
                      className="admin-input px-4 py-3 text-sm"
                    />
                    <input
                      type="number"
                      min="0"
                      value={extra.price}
                      onChange={(event) =>
                        setConfig((current) => ({
                          ...current,
                          extras: current.extras.map((item, index) =>
                            index === extraIndex
                              ? { ...item, price: Number(event.target.value) || 0 }
                              : item
                          ),
                        }))
                      }
                      placeholder="Precio"
                      className="admin-input px-4 py-3 text-sm"
                    />
                    <select
                      value={extra.pricingType}
                      onChange={(event) =>
                        setConfig((current) => ({
                          ...current,
                          extras: current.extras.map((item, index) =>
                            index === extraIndex
                              ? {
                                  ...item,
                                  pricingType: event.target.value as ExtraPricingType,
                                }
                              : item
                          ),
                        }))
                      }
                      className="admin-input px-4 py-3 text-sm"
                    >
                      <option value={ExtraPricingType.PER_UNIT}>Por unidad</option>
                      <option value={ExtraPricingType.FIXED}>Cargo fijo</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      value={extra.includedQuantity}
                      onChange={(event) =>
                        setConfig((current) => ({
                          ...current,
                          extras: current.extras.map((item, index) =>
                            index === extraIndex
                              ? {
                                  ...item,
                                  includedQuantity: Number(event.target.value) || 0,
                                }
                              : item
                          ),
                        }))
                      }
                      placeholder="Cantidad sin costo"
                      className="admin-input px-4 py-3 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setConfig((current) => ({
                          ...current,
                          extras: current.extras.filter((_, index) => index !== extraIndex),
                        }))
                      }
                      className={destructiveButtonClass}
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ))}

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

              <div className="admin-panel rounded-[24px] p-4 sm:p-5">
                <p className="admin-label text-sm font-medium">Textos visibles</p>
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
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
              <div className="space-y-5">
                <div className="admin-panel rounded-[24px] p-4 sm:p-5">
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
                    />
                    <div
                      className="h-12 w-12 rounded-2xl border"
                      style={{ backgroundColor: config.branding.secondaryColor }}
                    />
                  </div>
                </div>

                <div className="admin-panel rounded-[24px] p-4 sm:p-5">
                  <p className="admin-label text-sm font-medium">Categorías y opciones</p>
                  <div className="mt-4 space-y-3">
                    {config.categories.map((category) => (
                      <div key={category.id ?? category.name} className="rounded-2xl border border-[#e9dfd1] bg-white p-4">
                        <p className="font-semibold text-slate-900">{category.name}</p>
                        <p className="admin-muted mt-1 text-sm leading-6">
                          {category.multiSelect ? "Permite varias opciones" : "Permite una sola opción"}
                        </p>
                        <ul className="mt-3 space-y-1 text-sm text-slate-700">
                          {category.options.map((option) => (
                            <li key={option.id ?? option.name}>
                              {option.name} · {config.branding.currency} {option.price}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <aside className="space-y-5">
                <div className="admin-panel rounded-[24px] p-4 sm:p-5">
                  <p className="admin-label text-sm font-medium">Resumen del módulo</p>
                  <div className="mt-4 space-y-3 text-sm text-slate-700">
                    <p>{summaryStats.categoryCount} categorías configuradas</p>
                    <p>{summaryStats.optionCount} opciones de servicio</p>
                    <p>{summaryStats.extraCount} extras configurados</p>
                    <p>Moneda: {config.branding.currency}</p>
                    <p>Idioma: {config.branding.language}</p>
                    <p>
                      Máximo de categorías activas:{" "}
                      {config.rules.maxSelectedCategories ?? "Sin límite"}
                    </p>
                    <p>
                      Máximo por extra: {config.rules.maxQuantityPerExtra ?? "Sin límite"}
                    </p>
                  </div>
                </div>

                <div className="rounded-[24px] border border-[#eadfcb] bg-[#fffaf4] p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    Todo listo para guardar
                  </p>
                  <p className="admin-muted mt-2 text-sm leading-6">
                    Si ves bien este resumen, guarda la configuración para que la organización use este flujo en sus cotizaciones.
                  </p>
                </div>
              </aside>
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
