"use client";

import Link from "next/link";
import { ArrowRight, ClipboardList, FileText, X } from "lucide-react";
import { useEffect, useState } from "react";

interface CaptureResultShortcutProps {
  kind: "quote" | "order";
  title: string;
  description: string;
  href: string;
  actionLabel: string;
  onClose: () => void;
  duration?: number;
  lifted?: boolean;
}

export function CaptureResultShortcut({
  kind,
  title,
  description,
  href,
  actionLabel,
  onClose,
  duration = 30000,
  lifted = false,
}: CaptureResultShortcutProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setVisible(false);
      window.setTimeout(onClose, 250);
    }, duration);

    return () => window.clearTimeout(timerId);
  }, [duration, href, onClose]);

  function handleClose() {
    setVisible(false);
    window.setTimeout(onClose, 250);
  }

  const accentClassName =
    kind === "quote"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-sky-200 bg-sky-50 text-sky-700";
  const mobileBottomClassName = lifted
    ? "bottom-[calc(10.5rem+env(safe-area-inset-bottom))]"
    : "bottom-[calc(5.5rem+env(safe-area-inset-bottom))]";

  return (
    <div
      className={`fixed inset-x-0 z-40 px-4 transition-all duration-300 md:inset-auto md:right-6 md:w-[380px] md:px-0 ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      } ${mobileBottomClassName} md:bottom-6`}
    >
      <div className="rounded-[28px] border border-[#e8dece] bg-white/95 p-4 shadow-[0_20px_50px_rgba(15,23,42,0.14)] backdrop-blur">
        <div className="flex items-start gap-3">
          <span
            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${accentClassName}`}
          >
            {kind === "quote" ? <FileText size={18} /> : <ClipboardList size={18} />}
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-950">{title}</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Disponible por 30 segundos
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-[#efe6d8] text-slate-500 transition hover:bg-slate-50"
            aria-label="Cerrar acceso rápido"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Link
            href={href}
            className="admin-primary inline-flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-semibold"
          >
            {actionLabel}
            <ArrowRight size={16} />
          </Link>
          <button
            type="button"
            onClick={handleClose}
            className="admin-secondary inline-flex items-center justify-center px-4 py-3 text-sm font-semibold"
          >
            Seguir capturando
          </button>
        </div>
      </div>
    </div>
  );
}
