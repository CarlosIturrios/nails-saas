"use client";

import { CheckCircle2, Circle, CircleDashed, X } from "lucide-react";

import type { CaptureSetupSectionId } from "@/src/features/quote-config-admin/lib/capture-setup-state";

export interface MobileCaptureSectionItem {
  id: CaptureSetupSectionId;
  label: string;
  description: string;
  status: "empty" | "progress" | "complete";
  optional?: boolean;
}

interface MobileSectionSheetProps {
  open: boolean;
  sections: MobileCaptureSectionItem[];
  activeSectionId: CaptureSetupSectionId;
  onSelect: (sectionId: CaptureSetupSectionId) => void;
  onClose: () => void;
}

function SectionStatusIcon({
  status,
}: Pick<MobileCaptureSectionItem, "status">) {
  if (status === "complete") {
    return <CheckCircle2 size={18} className="text-emerald-600" />;
  }

  if (status === "progress") {
    return <CircleDashed size={18} className="text-amber-600" />;
  }

  return <Circle size={18} className="text-slate-400" />;
}

export function MobileSectionSheet({
  open,
  sections,
  activeSectionId,
  onSelect,
  onClose,
}: MobileSectionSheetProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 xl:hidden">
      <button
        type="button"
        aria-label="Cerrar secciones"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[1px]"
        onClick={onClose}
      />

      <div className="absolute inset-x-0 bottom-0 rounded-t-[32px] border border-[#e8dece] bg-[#fffdf9] p-4 shadow-[0_-18px_42px_rgba(15,23,42,0.18)]">
        <div className="mx-auto max-w-lg">
          <div className="flex items-start justify-between gap-4 border-b border-[#efe6d8] pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Secciones
              </p>
              <h2 className="mt-2 font-poppins text-xl font-semibold text-slate-950">
                Muévete sin perder tus cambios
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Puedes volver a cualquier parte cuando quieras.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#eadfcb] bg-white text-slate-500"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-4 space-y-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
            {sections.map((section, index) => {
              const active = section.id === activeSectionId;

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => {
                    onSelect(section.id);
                    onClose();
                  }}
                  className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
                    active
                      ? "border-[#c6a66b] bg-[#fffaf2] shadow-[0_14px_30px_rgba(198,166,107,0.14)]"
                      : "border-[#eadfcb] bg-white"
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
                          <span className="rounded-full border border-[#ddd1bf] bg-[#fffaf2] px-2.5 py-1 text-[11px] font-semibold text-slate-600">
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
        </div>
      </div>
    </div>
  );
}
