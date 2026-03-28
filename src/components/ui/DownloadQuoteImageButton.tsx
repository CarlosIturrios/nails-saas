"use client";

import { Download } from "lucide-react";
import { useState } from "react";

import { downloadQuoteImage } from "@/src/components/ui/downloadQuoteImage";
import Toast from "@/src/components/ui/Toast";

interface DownloadQuoteImageButtonProps {
  branding: {
    businessName: string;
    organizationName: string;
    logoUrl?: string | null;
    primaryColor?: string | null;
    secondaryColor?: string | null;
    currency: string;
    language: string;
  };
  title: string;
  subtitle?: string | null;
  totalLabel?: string | null;
  total: number;
  items: Array<{
    label: string;
    amount: number;
    detail?: string;
  }>;
  isLegacyTemplate?: boolean;
  className?: string;
  label?: string;
}

export function DownloadQuoteImageButton({
  branding,
  title,
  subtitle,
  totalLabel,
  total,
  items,
  isLegacyTemplate = false,
  className = "admin-secondary inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold",
  label = "Descargar cotización",
}: DownloadQuoteImageButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  async function handleDownload() {
    if (downloading) {
      return;
    }

    setDownloading(true);

    try {
      await downloadQuoteImage({
        branding,
        title,
        subtitle,
        totalLabel,
        total,
        rows: items,
        isLegacyTemplate,
        filename: "cotizacion-v2.png",
      });
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "No se pudo descargar la cotización",
        type: "error",
      });
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void handleDownload()}
        disabled={downloading}
        className={className}
      >
        <Download size={16} />
        {downloading ? "Generando imagen..." : label}
      </button>

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
