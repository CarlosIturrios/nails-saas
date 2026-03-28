import Link from "next/link";

import { QuoteCalculatorV2 } from "@/src/features/quote-calculator-v2/components/QuoteCalculatorV2";
import {
  buildQuoteConfigInputFromPreset,
  QUOTE_CONFIG_PRESETS,
  type QuoteConfigPresetKey,
} from "@/src/features/quote-calculator-v2/lib/presets";
import type { OrganizationQuoteConfigInput, OrganizationQuoteConfigView } from "@/src/features/quote-calculator-v2/lib/types";
import { getIndustryPresentation } from "@/src/features/v2/presentation";
import { V2_ROUTES } from "@/src/features/v2/routing";
import { V2PageHero, V2QuickLink } from "@/src/features/v2/shell/V2Shell";
import { requireCurrentOrganization } from "@/src/lib/organizations/context";

interface CotizacionesDemoPageProps {
  searchParams: Promise<{
    preset?: string;
  }>;
}

function toDemoView(input: OrganizationQuoteConfigInput): OrganizationQuoteConfigView {
  return {
    organizationId: input.organizationId,
    branding: input.branding,
    categories: input.categories.map((category, categoryIndex) => ({
      ...category,
      id: `demo-category-${categoryIndex}`,
      options: category.options.map((option, optionIndex) => ({
        ...option,
        id: `demo-option-${categoryIndex}-${optionIndex}`,
      })),
    })),
    extras: input.extras.map((extra, extraIndex) => ({
      ...extra,
      id: `demo-extra-${extraIndex}`,
    })),
    rules: input.rules,
    ui: input.ui,
  };
}

export default async function CotizacionesPage({
  searchParams,
}: CotizacionesDemoPageProps) {
  const context = await requireCurrentOrganization();
  const query = await searchParams;
  const selectedPreset =
    query.preset && query.preset in QUOTE_CONFIG_PRESETS && query.preset !== "none"
      ? (query.preset as QuoteConfigPresetKey)
      : ("nail_salon_demo" as QuoteConfigPresetKey);

  const demoConfig = toDemoView(
    buildQuoteConfigInputFromPreset(
      selectedPreset,
      context.currentOrganizationId,
      `${context.currentOrganization?.name ?? "Demo"} Demo`
    )
  );
  const presentation = getIndustryPresentation({
    businessType: demoConfig.branding.businessType,
    presetKey: selectedPreset,
  });

  return (
    <main className="min-h-screen bg-[#f7f5ef] px-4 py-5 text-slate-950 sm:px-6 lg:px-8 xl:px-10 lg:py-8">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <V2PageHero
          kicker="Demo"
          title="Demo de captura"
          description="Este espacio sigue existiendo para probar presets, comparar estilos y revisar cómo se vería el módulo principal antes de usarlo en la operación real."
          aside={
            <Link
              href={V2_ROUTES.capture}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#e8dece] bg-white px-4 py-3 text-sm font-semibold text-slate-700"
            >
              Ir a capturar
            </Link>
          }
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Object.entries(QUOTE_CONFIG_PRESETS)
            .filter(([key]) => key !== "none")
            .map(([key, preset]) => (
              <V2QuickLink
                key={key}
                href={`/cotizaciones?preset=${key}`}
                title={preset.label}
                description={preset.description}
              />
            ))}
        </section>

        <section className="rounded-[28px] border border-[#e8dece] bg-white p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Preset activo
          </p>
          <h2 className="mt-3 font-poppins text-2xl font-semibold text-slate-950">
            {QUOTE_CONFIG_PRESETS[selectedPreset].label}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {QUOTE_CONFIG_PRESETS[selectedPreset].description}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Módulo principal: <span className="font-semibold">{presentation.primaryModuleLabel}</span>
          </p>
        </section>

        <QuoteCalculatorV2
          config={demoConfig}
          organizationName={`${context.currentOrganization?.name ?? "Demo"} · Demo`}
          presentation={presentation}
          assignableUsers={[]}
          canUseManualAdjustments
          canSaveQuotes={false}
          canSaveOrders={false}
          canChargeOrders={false}
          canScheduleOrders
          demoMode
        />
      </div>
    </main>
  );
}
