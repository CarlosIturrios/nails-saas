"use client";

import { CheckCircle2, Circle, CircleDashed, Eye, Layers3, Save } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { MobileSectionSheet } from "@/src/features/quote-config-admin/components/MobileSectionSheet";
import type { CaptureSetupSectionId } from "@/src/features/quote-config-admin/lib/capture-setup-state";

interface CaptureSetupSection {
  id: CaptureSetupSectionId;
  label: string;
  description: string;
  status: "empty" | "progress" | "complete";
  optional?: boolean;
}

interface CaptureSetupShellProps {
  title: string;
  description: string;
  organizationName: string;
  organizationSelector?: ReactNode;
  saveIndicator?: ReactNode;
  sections: CaptureSetupSection[];
  activeSectionId: CaptureSetupSectionId;
  onSectionSelect: (sectionId: CaptureSetupSectionId) => void;
  sectionTitle: string;
  sectionDescription: string;
  sectionEyebrow?: string;
  children: ReactNode;
  primaryAction: ReactNode;
  secondaryAction?: ReactNode;
  utilityAction?: ReactNode;
  footerHelperText?: string;
  previewAction?: ReactNode;
  exitAction?: ReactNode;
}

function SectionStatusIcon({
  status,
}: Pick<CaptureSetupSection, "status">) {
  if (status === "complete") {
    return <CheckCircle2 size={18} className="text-emerald-600" />;
  }

  if (status === "progress") {
    return <CircleDashed size={18} className="text-amber-600" />;
  }

  return <Circle size={18} className="text-slate-400" />;
}

export function CaptureSetupShell({
  title,
  description,
  organizationName,
  organizationSelector,
  saveIndicator,
  sections,
  activeSectionId,
  onSectionSelect,
  sectionTitle,
  sectionDescription,
  sectionEyebrow,
  children,
  primaryAction,
  secondaryAction,
  utilityAction,
  footerHelperText,
  previewAction,
  exitAction,
}: CaptureSetupShellProps) {
  const [mobileSectionsOpen, setMobileSectionsOpen] = useState(false);
  const activeSectionIndex = Math.max(
    0,
    sections.findIndex((section) => section.id === activeSectionId)
  );
  const progress = useMemo(() => {
    if (sections.length === 0) {
      return 0;
    }

    const total = sections.reduce((sum, section) => {
      if (section.status === "complete") {
        return sum + 1;
      }

      if (section.status === "progress") {
        return sum + 0.55;
      }

      return sum;
    }, 0);

    return Math.round((total / sections.length) * 100);
  }, [sections]);

  return (
    <>
      <section className="space-y-4 sm:space-y-5 lg:space-y-6">
        <header className="admin-surface rounded-[32px] p-5 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Configuración guiada de captura
              </p>
              <h1 className="mt-3 font-poppins text-2xl font-semibold text-slate-950 sm:text-3xl">
                {title}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
                {description}
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 xl:w-[360px] xl:items-end">
              {organizationSelector ? <div className="w-full">{organizationSelector}</div> : null}
              {saveIndicator ? <div className="w-full">{saveIndicator}</div> : null}
            </div>
          </div>
        </header>

        <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="hidden xl:block">
            <div className="sticky top-6 space-y-4">
              <section className="admin-surface rounded-[30px] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Progreso
                </p>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-3xl font-semibold text-slate-950">{progress}%</p>
                    <p className="mt-1 text-sm text-slate-600">deja lista tu captura</p>
                  </div>
                  <div className="rounded-2xl border border-[#eadfcb] bg-[#fffaf2] px-3 py-2 text-right">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Organización
                    </p>
                    <p className="mt-1 max-w-[140px] truncate text-sm font-semibold text-slate-950">
                      {organizationName}
                    </p>
                  </div>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#f2eadc]">
                  <div
                    className="h-full rounded-full bg-slate-900 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-600">
                  Revisa cualquier sección cuando quieras. Nada de lo que avances se pierde.
                </p>
              </section>

              <nav className="admin-surface rounded-[30px] p-3">
                <div className="px-3 pb-2 pt-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Mapa de secciones
                  </p>
                </div>

                <div className="space-y-2">
                  {sections.map((section, index) => {
                    const active = section.id === activeSectionId;

                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => onSectionSelect(section.id)}
                        className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
                          active
                            ? "border-[#c6a66b] bg-[#fffaf2] shadow-[0_14px_32px_rgba(198,166,107,0.14)]"
                            : "border-[#eadfcb] bg-white hover:border-[#d6c8b3]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 inline-flex shrink-0">
                            <SectionStatusIcon status={section.status} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-slate-950">
                                {index + 1}. {section.label}
                              </p>
                              {section.optional ? (
                                <span className="rounded-full border border-[#ddd1bf] bg-[#fffdf7] px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                  Opcional
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              {section.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </nav>

              {previewAction || exitAction ? (
                <section className="admin-surface rounded-[30px] p-4">
                  <div className="space-y-3">
                    {previewAction ? (
                      <div className="flex items-center gap-3 rounded-[24px] border border-[#eadfcb] bg-[#fffaf2] p-4">
                        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-900 shadow-sm">
                          <Eye size={18} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-950">
                            Vista previa de captura
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            Mira cómo verá tu equipo el arranque operativo.
                          </p>
                        </div>
                      </div>
                    ) : null}
                    {previewAction}
                    {exitAction ? (
                      <div className="flex items-center gap-3 rounded-[24px] border border-[#eadfcb] bg-white p-4">
                        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff7eb] text-slate-900 shadow-sm">
                          <Save size={18} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-950">Guardar y salir</p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            Vuelve después y retoma justo donde te quedaste.
                          </p>
                        </div>
                      </div>
                    ) : null}
                    {exitAction}
                  </div>
                </section>
              ) : null}
            </div>
          </aside>

          <div className="space-y-4 sm:space-y-5">
            <section className="admin-surface rounded-[28px] p-4 xl:hidden">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Paso {activeSectionIndex + 1} de {sections.length}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {sections[activeSectionIndex]?.label}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{progress}% listo</p>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileSectionsOpen(true)}
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#eadfcb] bg-[#fffaf2] px-4 py-3 text-sm font-semibold text-slate-900"
                >
                  <Layers3 size={18} className="mr-2" />
                  Secciones
                </button>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#f2eadc]">
                <div
                  className="h-full rounded-full bg-slate-900 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </section>

            <section className="admin-surface rounded-[32px] p-5 sm:p-6 lg:p-8">
              <div className="border-b border-[#efe6d8] pb-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-[#ddd1bf] bg-[#fffaf2] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                    {sectionEyebrow ?? `Sección ${activeSectionIndex + 1}`}
                  </span>
                </div>
                <h2 className="mt-3 font-poppins text-2xl font-semibold text-slate-950">
                  {sectionTitle}
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
                  {sectionDescription}
                </p>
              </div>

              <div className="mt-6">{children}</div>
            </section>

            <div className="h-[13rem] sm:h-[14rem] xl:hidden" />

            <footer className="hidden xl:block">
              <div className="admin-surface rounded-[28px] p-4">
                {footerHelperText ? (
                  <p className="px-1 pb-3 text-sm leading-6 text-slate-600">{footerHelperText}</p>
                ) : null}

                {utilityAction ? <div className="pb-3">{utilityAction}</div> : null}

                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-[160px]">{secondaryAction}</div>
                  <div className="flex min-w-[220px] justify-end">{primaryAction}</div>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </section>

      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 px-4 pb-3 pt-3 xl:hidden">
        <div className="mx-auto max-w-5xl">
          <div className="pointer-events-auto admin-surface rounded-[26px] border border-[#eadfcb] bg-[rgba(255,253,250,0.96)] p-3 shadow-[0_-12px_30px_rgba(15,23,42,0.1)] backdrop-blur-xl">
            {footerHelperText ? (
              <p className="px-1 pb-3 text-xs leading-5 text-slate-600">{footerHelperText}</p>
            ) : null}

            {utilityAction ? <div className="pb-3">{utilityAction}</div> : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              {secondaryAction ? <div className="w-full sm:w-auto">{secondaryAction}</div> : <div />}
              <div className="w-full sm:w-auto">{primaryAction}</div>
            </div>
          </div>
        </div>
      </div>

      <MobileSectionSheet
        open={mobileSectionsOpen}
        sections={sections}
        activeSectionId={activeSectionId}
        onSelect={onSectionSelect}
        onClose={() => setMobileSectionsOpen(false)}
      />
    </>
  );
}
