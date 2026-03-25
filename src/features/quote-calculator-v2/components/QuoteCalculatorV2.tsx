"use client";

import html2canvas from "html2canvas";
import { useMemo, useRef, useState } from "react";

import { AdminLogoutButton } from "@/src/admin/components/AdminLogoutButton";
import Toast from "@/src/components/ui/Toast";
import { getEffectiveLogoUrl } from "@/src/features/quote-calculator-v2/lib/logo";
import { OrganizationQuoteConfigView } from "@/src/features/quote-calculator-v2/lib/types";

interface QuoteCalculatorV2Props {
  config: OrganizationQuoteConfigView;
  organizationName: string;
  canUseManualAdjustments?: boolean;
}

interface ManualAdjustment {
  id: string;
  label: string;
  amount: number;
}

async function resolveLogoSource(logoUrl: string) {
  if (!logoUrl) {
    return "";
  }

  const normalized = logoUrl.trim();

  if (
    normalized.startsWith("/") ||
    normalized.startsWith("data:") ||
    normalized.startsWith("blob:")
  ) {
    return normalized;
  }

  try {
    const response = await fetch(normalized);

    if (!response.ok) {
      return normalized;
    }

    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : normalized);
      reader.onerror = () => reject(new Error("No se pudo leer el logo"));
      reader.readAsDataURL(blob);
    });
  } catch {
    return normalized;
  }
}

async function waitForImageLoad(image: HTMLImageElement) {
  if (image.complete) {
    return;
  }

  await new Promise<void>((resolve) => {
    image.onload = () => resolve();
    image.onerror = () => resolve();
  });
}

function formatMoney(value: number, currency: string, language: string) {
  return new Intl.NumberFormat(language, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

const MODERN_TEMPLATE_THEMES = {
  modern: {
    pageBackground: "linear-gradient(180deg, #fffdfa 0%, #fbf7ef 100%)",
    surfaceBackground: "rgba(255, 255, 255, 0.94)",
    surfaceBorder: "#eadfcb",
    panelBackground: "#fffdfa",
    panelBorder: "#eadfcb",
    badgeBackground: "#fffaf2",
    badgeBorder: "#ddd1bf",
    badgeText: "#6f6455",
    summaryBackground: "rgba(255, 255, 255, 0.96)",
    summaryBorder: "#eadfcb",
    optionActiveBackground: "#fffaf2",
    optionActiveBorder: "#c6a66b",
    optionInactiveBackground: "#ffffff",
    optionInactiveBorder: "#eadfcb",
    optionHoverBorder: "#d6c8b3",
    accentText: "#1f2937",
    primaryButton: "#1f2937",
    primaryButtonHover: "#111827",
  },
  beauty_soft: {
    pageBackground: "linear-gradient(180deg, #fffafc 0%, #fff3f8 100%)",
    surfaceBackground: "rgba(255, 255, 255, 0.96)",
    surfaceBorder: "#efd1df",
    panelBackground: "#fff8fb",
    panelBorder: "#efd1df",
    badgeBackground: "#fff1f7",
    badgeBorder: "#e7bfd2",
    badgeText: "#8a4d6d",
    summaryBackground: "linear-gradient(180deg, #fffafc 0%, #fff4f8 100%)",
    summaryBorder: "#efd1df",
    optionActiveBackground: "#fff1f7",
    optionActiveBorder: "#d68bad",
    optionInactiveBackground: "#ffffff",
    optionInactiveBorder: "#efd1df",
    optionHoverBorder: "#e0a8c1",
    accentText: "#8a4d6d",
    primaryButton: "#9d4c73",
    primaryButtonHover: "#8a3f63",
  },
  barber_classic: {
    pageBackground: "linear-gradient(180deg, #fafaf9 0%, #f5f5f4 100%)",
    surfaceBackground: "rgba(255, 255, 255, 0.96)",
    surfaceBorder: "#d6d3d1",
    panelBackground: "#fcfbfa",
    panelBorder: "#d6d3d1",
    badgeBackground: "#f5f5f4",
    badgeBorder: "#d6d3d1",
    badgeText: "#44403c",
    summaryBackground: "linear-gradient(180deg, #ffffff 0%, #f5f5f4 100%)",
    summaryBorder: "#d6d3d1",
    optionActiveBackground: "#f5f5f4",
    optionActiveBorder: "#78716c",
    optionInactiveBackground: "#ffffff",
    optionInactiveBorder: "#d6d3d1",
    optionHoverBorder: "#a8a29e",
    accentText: "#292524",
    primaryButton: "#44403c",
    primaryButtonHover: "#292524",
  },
  wellness_calm: {
    pageBackground: "linear-gradient(180deg, #f8fafc 0%, #f5f3ff 100%)",
    surfaceBackground: "rgba(255, 255, 255, 0.95)",
    surfaceBorder: "#ddd6fe",
    panelBackground: "#faf7ff",
    panelBorder: "#ddd6fe",
    badgeBackground: "#f3f0ff",
    badgeBorder: "#d8ccff",
    badgeText: "#6b5b95",
    summaryBackground: "linear-gradient(180deg, #faf7ff 0%, #ffffff 100%)",
    summaryBorder: "#ddd6fe",
    optionActiveBackground: "#f3f0ff",
    optionActiveBorder: "#b8a6f2",
    optionInactiveBackground: "#ffffff",
    optionInactiveBorder: "#ddd6fe",
    optionHoverBorder: "#c4b5fd",
    accentText: "#5b4b8a",
    primaryButton: "#6b5b95",
    primaryButtonHover: "#58497c",
  },
  clinical_clean: {
    pageBackground: "linear-gradient(180deg, #f7fffd 0%, #ecfeff 100%)",
    surfaceBackground: "rgba(255, 255, 255, 0.96)",
    surfaceBorder: "#bfe7e2",
    panelBackground: "#f7fffd",
    panelBorder: "#bfe7e2",
    badgeBackground: "#effcf9",
    badgeBorder: "#bfe7e2",
    badgeText: "#0f766e",
    summaryBackground: "linear-gradient(180deg, #f7fffd 0%, #ffffff 100%)",
    summaryBorder: "#bfe7e2",
    optionActiveBackground: "#effcf9",
    optionActiveBorder: "#59c5b7",
    optionInactiveBackground: "#ffffff",
    optionInactiveBorder: "#bfe7e2",
    optionHoverBorder: "#7dd3c7",
    accentText: "#0f766e",
    primaryButton: "#0f766e",
    primaryButtonHover: "#115e59",
  },
  workshop_pro: {
    pageBackground: "linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
    surfaceBackground: "rgba(255, 255, 255, 0.96)",
    surfaceBorder: "#cbd5e1",
    panelBackground: "#f8fafc",
    panelBorder: "#cbd5e1",
    badgeBackground: "#eef2f7",
    badgeBorder: "#cbd5e1",
    badgeText: "#334155",
    summaryBackground: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
    summaryBorder: "#cbd5e1",
    optionActiveBackground: "#e2e8f0",
    optionActiveBorder: "#64748b",
    optionInactiveBackground: "#ffffff",
    optionInactiveBorder: "#cbd5e1",
    optionHoverBorder: "#94a3b8",
    accentText: "#334155",
    primaryButton: "#334155",
    primaryButtonHover: "#1e293b",
  },
  carwash_fresh: {
    pageBackground: "linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 100%)",
    surfaceBackground: "rgba(255, 255, 255, 0.96)",
    surfaceBorder: "#bae6fd",
    panelBackground: "#f0f9ff",
    panelBorder: "#bae6fd",
    badgeBackground: "#e0f2fe",
    badgeBorder: "#bae6fd",
    badgeText: "#0369a1",
    summaryBackground: "linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%)",
    summaryBorder: "#bae6fd",
    optionActiveBackground: "#e0f2fe",
    optionActiveBorder: "#38bdf8",
    optionInactiveBackground: "#ffffff",
    optionInactiveBorder: "#bae6fd",
    optionHoverBorder: "#7dd3fc",
    accentText: "#0369a1",
    primaryButton: "#0284c7",
    primaryButtonHover: "#0369a1",
  },
  craft_warm: {
    pageBackground: "linear-gradient(180deg, #fffbeb 0%, #fef3c7 100%)",
    surfaceBackground: "rgba(255, 255, 255, 0.95)",
    surfaceBorder: "#e7d2ad",
    panelBackground: "#fffaf0",
    panelBorder: "#e7d2ad",
    badgeBackground: "#fff4da",
    badgeBorder: "#e7d2ad",
    badgeText: "#92400e",
    summaryBackground: "linear-gradient(180deg, #fffaf0 0%, #ffffff 100%)",
    summaryBorder: "#e7d2ad",
    optionActiveBackground: "#fff1cc",
    optionActiveBorder: "#d4a373",
    optionInactiveBackground: "#ffffff",
    optionInactiveBorder: "#e7d2ad",
    optionHoverBorder: "#d6b98c",
    accentText: "#92400e",
    primaryButton: "#92400e",
    primaryButtonHover: "#78350f",
  },
  electrician_bold: {
    pageBackground: "linear-gradient(180deg, #fffbeb 0%, #fef9c3 100%)",
    surfaceBackground: "rgba(255, 255, 255, 0.96)",
    surfaceBorder: "#f7d873",
    panelBackground: "#fffdf2",
    panelBorder: "#f7d873",
    badgeBackground: "#fff7cc",
    badgeBorder: "#f7d873",
    badgeText: "#a16207",
    summaryBackground: "linear-gradient(180deg, #fffdf2 0%, #ffffff 100%)",
    summaryBorder: "#f7d873",
    optionActiveBackground: "#fff5b7",
    optionActiveBorder: "#eab308",
    optionInactiveBackground: "#ffffff",
    optionInactiveBorder: "#f7d873",
    optionHoverBorder: "#facc15",
    accentText: "#a16207",
    primaryButton: "#ca8a04",
    primaryButtonHover: "#a16207",
  },
} as const;

export function QuoteCalculatorV2({
  config,
  organizationName,
  canUseManualAdjustments = false,
}: QuoteCalculatorV2Props) {
  const isLegacyTemplate = config.branding.quoteTemplate === "legacy_gica";
  const effectiveLogoUrl = getEffectiveLogoUrl({
    businessType: config.branding.businessType,
    logoUrl: config.branding.logoUrl,
  });
  const modernTheme =
    MODERN_TEMPLATE_THEMES[config.branding.quoteTemplate as keyof typeof MODERN_TEMPLATE_THEMES] ??
    MODERN_TEMPLATE_THEMES.modern;
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [extraQuantities, setExtraQuantities] = useState<Record<string, number>>({});
  const [manualAdjustments, setManualAdjustments] = useState<ManualAdjustment[]>([]);
  const [manualLabel, setManualLabel] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  const activeCategoryCount = useMemo(
    () =>
      Object.values(selectedOptions).filter((items) => items.length > 0).length,
    [selectedOptions]
  );

  const totalSelectionCount = useMemo(
    () => Object.values(selectedOptions).reduce((sum, items) => sum + items.length, 0),
    [selectedOptions]
  );

  const selectedRows = useMemo(
    () =>
      config.categories.flatMap((category) => {
        const selectedIds = selectedOptions[category.id] ?? [];

        return category.options
          .filter((option) => selectedIds.includes(option.id))
          .map((option) => ({
            id: `${category.id}-${option.id}`,
            label: `${category.name} · ${option.name}`,
            amount: option.price,
          }));
      }),
    [config.categories, selectedOptions]
  );

  const extraRows = useMemo(
    () =>
      config.extras.flatMap((extra) => {
        const quantity = extraQuantities[extra.id] ?? 0;

        if (quantity <= 0) {
          return [];
        }

        const billableQuantity =
          extra.pricingType === "FIXED"
            ? 1
            : quantity;
        const amount =
          extra.pricingType === "FIXED" && quantity > 0
            ? extra.price
            : billableQuantity * extra.price;

        return [
          {
            id: extra.id,
            label:
              extra.pricingType === "FIXED"
                ? extra.name
                : `${extra.name} (${quantity})`,
            amount,
            quantity,
            pricingType: extra.pricingType,
            billableQuantity,
            includedQuantity: extra.includedQuantity,
          },
        ];
      }),
    [config.extras, extraQuantities]
  );

  const total = useMemo(
    () =>
      [...selectedRows, ...extraRows, ...manualAdjustments].reduce(
        (sum, item) => sum + item.amount,
        0
      ),
    [extraRows, manualAdjustments, selectedRows]
  );

  function toggleOption(categoryId: string, optionId: string) {
    const category = config.categories.find((item) => item.id === categoryId);

    if (!category) {
      return;
    }

    setSelectedOptions((current) => {
      const currentSelection = current[categoryId] ?? [];
      const alreadySelected = currentSelection.includes(optionId);

      if (alreadySelected) {
        return {
          ...current,
          [categoryId]: currentSelection.filter((item) => item !== optionId),
        };
      }

      const isNewCategory = currentSelection.length === 0;

      if (
        isNewCategory &&
        config.rules.maxSelectedCategories &&
        activeCategoryCount >= config.rules.maxSelectedCategories
      ) {
        setToast({
          message: `Solo puedes activar hasta ${config.rules.maxSelectedCategories} categorías al mismo tiempo.`,
          type: "info",
        });
        return current;
      }

      if (
        config.rules.maxTotalSelections &&
        totalSelectionCount >= config.rules.maxTotalSelections
      ) {
        setToast({
          message: `Solo puedes seleccionar hasta ${config.rules.maxTotalSelections} opciones en total.`,
          type: "info",
        });
        return current;
      }

      return {
        ...current,
        [categoryId]: category.multiSelect ? [...currentSelection, optionId] : [optionId],
      };
    });
  }

  function adjustExtra(extraId: string, delta: number) {
    setExtraQuantities((current) => {
      const nextValue = Math.max(0, (current[extraId] ?? 0) + delta);
      const max = config.rules.maxQuantityPerExtra;

      if (max && nextValue > max) {
        setToast({
          message: `Solo puedes registrar hasta ${max} unidades por extra.`,
          type: "info",
        });
        return current;
      }

      return {
        ...current,
        [extraId]: nextValue,
      };
    });
  }

  function resetQuote() {
    setSelectedOptions({});
    setExtraQuantities({});
    setManualAdjustments([]);
    setManualLabel("");
    setManualAmount("");
  }

  function addManualAdjustment() {
    const label = manualLabel.trim();
    const amount = Number(manualAmount);

    if (!label) {
      setToast({
        message: "Escribe el nombre del ajuste manual.",
        type: "info",
      });
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setToast({
        message: "Escribe un monto válido mayor a cero.",
        type: "info",
      });
      return;
    }

    setManualAdjustments((current) => [
      ...current,
      {
        id: `${Date.now()}-${current.length}`,
        label,
        amount: Math.round(amount),
      },
    ]);
    setManualLabel("");
    setManualAmount("");
  }

  function removeManualAdjustment(id: string) {
    setManualAdjustments((current) => current.filter((item) => item.id !== id));
  }

  async function downloadSummary() {
    if (total === 0 || downloading) {
      return;
    }

    setDownloading(true);

    const accentColor = config.branding.primaryColor || "#1f2937";
    const surfaceColor = config.branding.secondaryColor || "#fffaf4";
    const tempDiv = document.createElement("div");

    tempDiv.style.position = "fixed";
    tempDiv.style.left = "-10000px";
    tempDiv.style.top = "0";
    tempDiv.style.width = isLegacyTemplate ? "400px" : "440px";
    tempDiv.style.padding = isLegacyTemplate ? "20px" : "24px";
    tempDiv.style.background = "#ffffff";
    tempDiv.style.fontFamily = "Arial, sans-serif";
    tempDiv.style.color = "#111827";
    tempDiv.style.border = `2px solid ${accentColor}`;
    tempDiv.style.borderRadius = isLegacyTemplate ? "12px" : "32px";
    tempDiv.style.boxSizing = "border-box";
    tempDiv.style.boxShadow = isLegacyTemplate
      ? "none"
      : "0 12px 32px rgba(15, 23, 42, 0.06)";
    tempDiv.style.minHeight = isLegacyTemplate ? "0" : "720px";
    tempDiv.style.display = "flex";
    tempDiv.style.flexDirection = "column";

    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.flexDirection = "column";
    header.style.alignItems = "center";
    header.style.justifyContent = "center";
    header.style.padding = isLegacyTemplate ? "0 0 12px" : "28px 12px 12px";
    header.style.marginBottom = isLegacyTemplate ? "12px" : "18px";

    if (effectiveLogoUrl) {
      const logo = document.createElement("img");
      logo.src = await resolveLogoSource(effectiveLogoUrl);
      logo.alt = config.branding.businessName;
      logo.crossOrigin = "anonymous";
      logo.style.width = isLegacyTemplate ? "100px" : "180px";
      logo.style.height = isLegacyTemplate ? "100px" : "180px";
      logo.style.objectFit = "contain";
      logo.style.display = "block";
      logo.style.margin = "0 auto 18px auto";

      await waitForImageLoad(logo);

      header.appendChild(logo);
    } else {
      const fallbackLogo = document.createElement("div");
      fallbackLogo.textContent = config.branding.businessName.slice(0, 2).toUpperCase();
      fallbackLogo.style.width = isLegacyTemplate ? "100px" : "96px";
      fallbackLogo.style.height = isLegacyTemplate ? "100px" : "96px";
      fallbackLogo.style.display = "flex";
      fallbackLogo.style.alignItems = "center";
      fallbackLogo.style.justifyContent = "center";
      fallbackLogo.style.borderRadius = isLegacyTemplate ? "24px" : "999px";
      fallbackLogo.style.margin = "0 auto 18px auto";
      fallbackLogo.style.background = surfaceColor;
      fallbackLogo.style.color = accentColor;
      fallbackLogo.style.fontSize = "32px";
      fallbackLogo.style.fontWeight = "700";
      fallbackLogo.style.border = `1px solid ${accentColor}33`;
      header.appendChild(fallbackLogo);
    }

    const headerText = document.createElement("div");
    headerText.style.textAlign = "center";

    const overline = document.createElement("p");
    overline.textContent = organizationName;
    overline.style.margin = isLegacyTemplate ? "0 0 10px 0" : "0 0 6px 0";
    overline.style.fontSize = "11px";
    overline.style.fontWeight = "700";
    overline.style.letterSpacing = "0.14em";
    overline.style.textTransform = "uppercase";
    overline.style.color = accentColor;
    headerText.appendChild(overline);

    const title = document.createElement("h2");
    title.textContent =
      config.ui.titles.calculatorTitle || `Cotización ${config.branding.businessName}`;
    title.style.margin = "0";
    title.style.fontSize = isLegacyTemplate ? "22px" : "28px";
    title.style.lineHeight = "1.2";
    title.style.color = accentColor;
    title.style.fontWeight = isLegacyTemplate ? "700" : "500";
    headerText.appendChild(title);

    const subtitle = document.createElement("p");
    subtitle.textContent =
      config.ui.titles.calculatorSubtitle || "Resumen de servicios y extras";
    subtitle.style.margin = isLegacyTemplate ? "10px 0 0 0" : "12px 0 0 0";
    subtitle.style.fontSize = "14px";
    subtitle.style.lineHeight = "1.5";
    subtitle.style.color = "#475569";
    if (!isLegacyTemplate) {
      headerText.appendChild(subtitle);
    }

    header.appendChild(headerText);
    tempDiv.appendChild(header);

    const addRow = (label: string, value: string, detail?: string) => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.justifyContent = "space-between";
      row.style.alignItems = "flex-start";
      row.style.gap = "12px";
      row.style.padding = isLegacyTemplate ? "6px 0" : "10px 0";

      const leftBlock = document.createElement("div");
      leftBlock.style.flex = "1";
      leftBlock.style.minWidth = "0";

      const left = document.createElement("span");
      left.textContent = label;
      left.style.display = "block";
      left.style.fontSize = "14px";
      left.style.lineHeight = "1.5";
      left.style.color = "#1f2937";
      leftBlock.appendChild(left);

      if (detail) {
        const detailText = document.createElement("span");
        detailText.textContent = detail;
        detailText.style.display = "block";
        detailText.style.marginTop = "4px";
        detailText.style.fontSize = "12px";
        detailText.style.lineHeight = "1.4";
        detailText.style.color = "#64748b";
        leftBlock.appendChild(detailText);
      }

      const right = document.createElement("span");
      right.textContent = value;
      right.style.flexShrink = "0";
      right.style.fontSize = "14px";
      right.style.fontWeight = "700";
      right.style.color = "#111827";

      row.appendChild(leftBlock);
      row.appendChild(right);
      tempDiv.appendChild(row);

      const divider = document.createElement("div");
      divider.style.height = "1px";
      divider.style.background = isLegacyTemplate
        ? "rgba(212, 175, 55, 0.22)"
        : "rgba(226, 232, 240, 0.9)";
      divider.style.margin = isLegacyTemplate ? "0 0 6px 0" : "0 0 8px 0";
      tempDiv.appendChild(divider);
    };

    selectedRows.forEach((row) => {
      addRow(
        row.label,
        formatMoney(row.amount, config.branding.currency, config.branding.language)
      );
    });

    extraRows.forEach((row) => {
      addRow(
        row.label,
        formatMoney(row.amount, config.branding.currency, config.branding.language),
        row.pricingType === "PER_UNIT"
          ? `Se cobran ${row.billableQuantity} ${row.billableQuantity === 1 ? "unidad" : "unidades"}.`
          : "Cargo fijo"
      );
    });

    manualAdjustments.forEach((row) => {
      addRow(
        row.label,
        formatMoney(row.amount, config.branding.currency, config.branding.language),
        "Ajuste manual agregado antes de generar la cotización."
      );
    });

    const totalSection = document.createElement("div");
    totalSection.style.marginTop = isLegacyTemplate ? "14px" : "auto";
    totalSection.style.paddingTop = "16px";
    totalSection.style.borderTop = `2px dashed ${accentColor}`;

    const totalRow = document.createElement("div");
    totalRow.style.display = "flex";
    totalRow.style.justifyContent = "space-between";
    totalRow.style.alignItems = "center";
    totalRow.style.gap = "12px";

    const totalLabel = document.createElement("span");
    totalLabel.textContent = `${config.ui.labels.total || "Total"}:`;
    totalLabel.style.fontSize = isLegacyTemplate ? "18px" : "20px";
    totalLabel.style.fontWeight = "700";
    totalLabel.style.color = accentColor;

    const totalValue = document.createElement("span");
    totalValue.textContent = formatMoney(
      total,
      config.branding.currency,
      config.branding.language
    );
    totalValue.style.fontSize = isLegacyTemplate ? "24px" : "28px";
    totalValue.style.fontWeight = "700";
    totalValue.style.color = accentColor;

    totalRow.appendChild(totalLabel);
    totalRow.appendChild(totalValue);
    totalSection.appendChild(totalRow);
    tempDiv.appendChild(totalSection);

    document.body.appendChild(tempDiv);

    try {
      const canvas = await html2canvas(tempDiv, {
        scale: 3,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "cotizacion-v2.png";
      link.click();
    } catch {
      setToast({
        message: "No se pudo descargar la cotización. Intenta nuevamente.",
        type: "error",
      });
    } finally {
      document.body.removeChild(tempDiv);
      setDownloading(false);
    }
  }

  if (isLegacyTemplate) {
    const legacyButtonStyle = (active: boolean) =>
      active
        ? {
            borderColor: config.branding.primaryColor,
            backgroundColor: config.branding.secondaryColor,
            boxShadow: "0 10px 25px rgba(212, 175, 55, 0.12)",
          }
        : {
            borderColor: "#fde68a",
            backgroundColor: "rgba(255,255,255,0.88)",
          };

    return (
      <>
        <main
          className="min-h-screen px-4 py-8 sm:px-6 lg:px-8"
          style={{
            background:
              "linear-gradient(to bottom right, #ffffff, #fffbeb, #fef3c7)",
          }}
        >
          <div className="mx-auto w-full max-w-5xl space-y-8">
            <div className="flex justify-end">
              <AdminLogoutButton />
            </div>

            <div className="space-y-8 relative">
              <div className="sparkle" style={{ top: "8%", left: "5%" }} />
              <div className="sparkle" style={{ top: "24%", right: "8%", animationDelay: "1s" }} />
              <div className="sparkle" style={{ top: "62%", left: "12%", animationDelay: "2s" }} />

              <header className="relative text-center">
                <div className="mb-4 flex justify-center">
                  {effectiveLogoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={effectiveLogoUrl}
                      alt={config.branding.businessName}
                      className="h-24 w-24 object-contain sm:h-28 sm:w-28"
                    />
                  ) : (
                    <div
                      className="flex h-24 w-24 items-center justify-center rounded-full border-2 text-3xl font-semibold sm:h-28 sm:w-28"
                      style={{
                        borderColor: config.branding.primaryColor,
                        color: config.branding.primaryColor,
                        backgroundColor: "#ffffff",
                      }}
                    >
                      {config.branding.businessName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                <h1 className="shimmer-text text-4xl font-bold md:text-5xl">
                  {config.branding.businessName}
                </h1>
                <p className="mt-2 text-lg font-light tracking-wide text-amber-700/80">
                  {config.ui.titles.calculatorTitle || "Calculadora de cotizaciones"}
                </p>
                <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-amber-900/70 sm:text-base">
                  {config.ui.titles.calculatorSubtitle || config.ui.texts.servicesHelper}
                </p>
                <div className="section-divider mx-auto mt-4 w-32" />
              </header>

              <div className="grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
                <div className="space-y-6">
                  <section className="card-glam rounded-2xl p-6 shadow-lg">
                    <h2 className="mb-1 text-lg font-medium text-amber-900">
                      {config.ui.titles.servicesTitle || "Servicios"}
                    </h2>
                    <p className="mb-4 text-sm leading-6 text-amber-800/70">
                      {config.ui.texts.servicesHelper ||
                        "Selecciona una o varias categorías y luego marca las opciones necesarias."}
                    </p>

                    <div className="space-y-4">
                      {config.categories.map((category) => {
                        const selectedIds = selectedOptions[category.id] ?? [];

                        return (
                          <div
                            key={category.id}
                            className="rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50/80 to-white p-4"
                          >
                            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <h3 className="text-lg font-semibold text-slate-950">
                                  {category.name}
                                </h3>
                                {category.description ? (
                                  <p className="mt-1 text-sm leading-6 text-amber-800/70">
                                    {category.description}
                                  </p>
                                ) : null}
                              </div>
                              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                                {category.multiSelect ? "Múltiple" : "Una opción"}
                              </span>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                              {category.options.map((option) => {
                                const active = selectedIds.includes(option.id);

                                return (
                                  <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => toggleOption(category.id, option.id)}
                                    className="rounded-xl border p-4 text-left text-sm transition"
                                    style={legacyButtonStyle(active)}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <p className="font-semibold text-slate-950">
                                          {option.name}
                                        </p>
                                        {option.description ? (
                                          <p className="mt-1 text-xs leading-5 text-slate-600">
                                            {option.description}
                                          </p>
                                        ) : null}
                                      </div>
                                      <span className="shrink-0 font-semibold text-slate-900">
                                        {formatMoney(
                                          option.price,
                                          config.branding.currency,
                                          config.branding.language
                                        )}
                                      </span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  <section className="card-glam rounded-2xl p-6 shadow-lg">
                    <h2 className="mb-1 text-lg font-medium text-amber-900">
                      {config.ui.titles.extrasTitle || "Extras"}
                    </h2>
                    <p className="mb-4 text-sm leading-6 text-amber-800/70">
                      {config.ui.texts.extrasHelper ||
                        "Ajusta cantidades y cargos adicionales desde este bloque."}
                    </p>
                    <div className="space-y-3">
                      {config.extras.map((extra) => {
                        const quantity = extraQuantities[extra.id] ?? 0;
                        const billableQuantity =
                          extra.pricingType === "FIXED" ? (quantity > 0 ? 1 : 0) : quantity;
                        const liveAmount =
                          extra.pricingType === "FIXED" && quantity > 0
                            ? extra.price
                            : billableQuantity * extra.price;

                        return (
                          <div
                            key={extra.id}
                            className="flex items-center justify-between gap-4 rounded-xl border border-amber-100 bg-gradient-to-r from-amber-50 to-white p-3"
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-slate-950">{extra.name}</p>
                              <p className="mt-1 text-xs text-amber-700/80">
                                {extra.pricingType === "FIXED"
                                  ? `Cargo fijo de ${formatMoney(extra.price, config.branding.currency, config.branding.language)}`
                                  : `${formatMoney(extra.price, config.branding.currency, config.branding.language)} por unidad`}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => adjustExtra(extra.id, -1)}
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-200 bg-white"
                              >
                                −
                              </button>
                              <span className="w-5 text-center text-sm font-semibold">
                                {quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => adjustExtra(extra.id, 1)}
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-200 bg-white"
                              >
                                +
                              </button>
                              {quantity > 0 ? (
                                <span className="min-w-20 text-right text-sm font-semibold text-slate-900">
                                  {formatMoney(
                                    liveAmount,
                                    config.branding.currency,
                                    config.branding.language
                                  )}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {canUseManualAdjustments ? (
                    <section className="card-glam rounded-2xl p-6 shadow-lg">
                      <h2 className="mb-1 text-lg font-medium text-amber-900">Ajustes manuales</h2>
                      <p className="mb-4 text-sm leading-6 text-amber-800/70">
                        Agrega conceptos temporales si necesitas cotizar algo que aún no está registrado.
                      </p>
                      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]">
                        <input
                          value={manualLabel}
                          onChange={(event) => setManualLabel(event.target.value)}
                          placeholder="Concepto adicional"
                          className="admin-input px-4 py-3 text-sm"
                        />
                        <input
                          type="number"
                          min="0"
                          value={manualAmount}
                          onChange={(event) => setManualAmount(event.target.value)}
                          placeholder="Precio"
                          className="admin-input px-4 py-3 text-sm"
                        />
                        <button
                          type="button"
                          onClick={addManualAdjustment}
                          className="btn-glam rounded-xl px-5 py-3 text-sm font-semibold text-white"
                        >
                          Agregar
                        </button>
                      </div>

                      {manualAdjustments.length > 0 ? (
                        <div className="mt-4 space-y-3">
                          {manualAdjustments.map((item) => (
                            <div
                              key={item.id}
                              className="flex flex-col gap-3 rounded-xl border border-amber-100 bg-gradient-to-r from-amber-50 to-white p-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-950">{item.label}</p>
                                <p className="mt-1 text-xs text-amber-700/80">
                                  Ajuste manual visible solo en esta cotización.
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-semibold text-slate-900">
                                  {formatMoney(
                                    item.amount,
                                    config.branding.currency,
                                    config.branding.language
                                  )}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeManualAdjustment(item.id)}
                                  className="rounded-xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600"
                                >
                                  Quitar
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </section>
                  ) : null}
                </div>

                <aside className="space-y-6">
                  <div
                    ref={summaryRef}
                    className="rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-100 via-yellow-50 to-white p-6 shadow-xl"
                  >
                    <h2 className="shimmer-text mb-4 text-center text-lg font-semibold">
                      {config.ui.titles.summaryTitle || "Resumen"}
                    </h2>

                    {total === 0 ? (
                      <p className="py-4 text-center italic text-amber-600">
                        {config.ui.texts.emptySummary ||
                          "Selecciona al menos una opción para comenzar."}
                      </p>
                    ) : (
                      <>
                        <div className="space-y-2 text-sm">
                          {selectedRows.map((row) => (
                            <div key={row.id} className="flex justify-between gap-3">
                              <span>{row.label}</span>
                              <span className="shrink-0 font-semibold">
                                {formatMoney(
                                  row.amount,
                                  config.branding.currency,
                                  config.branding.language
                                )}
                              </span>
                            </div>
                          ))}

                          {extraRows.map((row) => (
                            <div key={row.id} className="flex justify-between gap-3">
                              <span>{row.label}</span>
                              <span className="shrink-0 font-semibold">
                                {formatMoney(
                                  row.amount,
                                  config.branding.currency,
                                  config.branding.language
                                )}
                              </span>
                            </div>
                          ))}

                          {manualAdjustments.map((row) => (
                            <div key={row.id} className="flex justify-between gap-3">
                              <span>{row.label}</span>
                              <span className="shrink-0 font-semibold">
                                {formatMoney(
                                  row.amount,
                                  config.branding.currency,
                                  config.branding.language
                                )}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="section-divider my-4" />

                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xl text-amber-900">
                            {config.ui.labels.total || "Total"}
                          </span>
                          <span className="shimmer-text text-3xl font-bold">
                            {formatMoney(
                              total,
                              config.branding.currency,
                              config.branding.language
                            )}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={downloadSummary}
                      disabled={total === 0 || downloading}
                      className="btn-glam w-full rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {downloading
                        ? "Generando imagen..."
                        : config.ui.labels.download || "Descargar cotización"}
                    </button>
                    <button
                      type="button"
                      onClick={resetQuote}
                      className="w-full rounded-xl border border-amber-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm"
                    >
                      {config.ui.labels.reset || "Nueva cotización"}
                    </button>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </main>

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

  return (
    <>
      <main
        className="admin-shell min-h-screen px-4 py-6 text-slate-950 sm:px-6 lg:px-8 xl:px-10 lg:py-8"
        style={{ background: modernTheme.pageBackground }}
      >
        <div className="mx-auto w-full max-w-7xl space-y-6">
          <header
            className="admin-surface rounded-3xl p-6 sm:p-8"
            style={{
              background: modernTheme.surfaceBackground,
              borderColor: modernTheme.surfaceBorder,
            }}
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className="admin-label text-sm font-medium" style={{ color: modernTheme.badgeText }}>
                  {organizationName}
                </p>
                <div className="mt-3 flex items-center gap-4">
                  {effectiveLogoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={effectiveLogoUrl}
                      alt={config.branding.businessName}
                      className="h-16 w-16 rounded-2xl border border-[#eadfcb] object-contain bg-white p-2"
                    />
                  ) : (
                    <div
                      className="flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-semibold text-white"
                      style={{ backgroundColor: modernTheme.primaryButton }}
                    >
                      {config.branding.businessName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h1 className="admin-title break-words font-poppins text-3xl font-semibold text-slate-950">
                      {config.ui.titles.calculatorTitle || config.branding.businessName}
                    </h1>
                    <p className="admin-muted mt-2 text-sm leading-6 sm:text-base">
                      {config.ui.titles.calculatorSubtitle ||
                        config.ui.texts.servicesHelper}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <AdminLogoutButton />
              </div>
            </div>
          </header>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <section className="space-y-6">
              <div
                className="admin-surface rounded-3xl p-6 sm:p-8"
                style={{
                  background: modernTheme.surfaceBackground,
                  borderColor: modernTheme.surfaceBorder,
                }}
              >
                <div className="flex flex-col gap-2">
                  <p className="admin-label text-sm font-medium">
                    {config.ui.titles.servicesTitle || "Servicios"}
                  </p>
                  <p className="admin-muted text-sm leading-6">
                    {config.ui.texts.servicesHelper ||
                      "Selecciona las opciones que quieres incluir en la cotización."}
                  </p>
                </div>

                <div className="mt-6 space-y-4">
                  {config.categories.map((category) => {
                    const selectedIds = selectedOptions[category.id] ?? [];

                    return (
                      <div
                        key={category.id}
                        className="admin-panel rounded-3xl p-5"
                        style={{
                          background: modernTheme.panelBackground,
                          borderColor: modernTheme.panelBorder,
                        }}
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h2 className="font-poppins text-xl font-semibold text-slate-950">
                              {category.name}
                            </h2>
                            {category.description ? (
                              <p className="admin-muted mt-2 text-sm leading-6">
                                {category.description}
                              </p>
                            ) : null}
                          </div>
                          <span
                            className="inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
                            style={{
                              borderColor: modernTheme.badgeBorder,
                              background: modernTheme.badgeBackground,
                              color: modernTheme.badgeText,
                            }}
                          >
                            {category.multiSelect ? "Múltiple" : "Una opción"}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          {category.options.map((option) => {
                            const active = selectedIds.includes(option.id);

                            return (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => toggleOption(category.id, option.id)}
                                className="rounded-2xl border p-4 text-left transition"
                                style={{
                                  borderColor: active
                                    ? modernTheme.optionActiveBorder
                                    : modernTheme.optionInactiveBorder,
                                  background: active
                                    ? modernTheme.optionActiveBackground
                                    : modernTheme.optionInactiveBackground,
                                }}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="min-w-0">
                                    <p className="font-semibold text-slate-950">
                                      {option.name}
                                    </p>
                                    {option.description ? (
                                      <p className="admin-muted mt-1 text-sm leading-6">
                                        {option.description}
                                      </p>
                                    ) : null}
                                  </div>
                                  <span className="text-sm font-semibold text-slate-900">
                                    {formatMoney(
                                      option.price,
                                      config.branding.currency,
                                      config.branding.language
                                    )}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div
                className="admin-surface rounded-3xl p-6 sm:p-8"
                style={{
                  background: modernTheme.surfaceBackground,
                  borderColor: modernTheme.surfaceBorder,
                }}
              >
                <div className="flex flex-col gap-2">
                  <p className="admin-label text-sm font-medium">
                    {config.ui.titles.extrasTitle || "Extras"}
                  </p>
                  <p className="admin-muted text-sm leading-6">
                    {config.ui.texts.extrasHelper ||
                      "Ajusta extras y cantidades según las necesidades del cliente."}
                  </p>
                </div>

                <div className="mt-6 space-y-3">
                  {config.extras.map((extra) => {
                    const quantity = extraQuantities[extra.id] ?? 0;
                    const billableQuantity =
                      extra.pricingType === "FIXED"
                        ? quantity > 0
                          ? 1
                          : 0
                        : quantity;
                    const liveAmount =
                      extra.pricingType === "FIXED" && quantity > 0
                        ? extra.price
                        : billableQuantity * extra.price;

                    return (
                      <div
                        key={extra.id}
                        className="admin-panel flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between"
                        style={{
                          background: modernTheme.panelBackground,
                          borderColor: modernTheme.panelBorder,
                        }}
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-950">{extra.name}</p>
                          {extra.description ? (
                            <p className="admin-muted mt-1 text-sm leading-6">
                              {extra.description}
                            </p>
                          ) : null}
                          <p className="admin-muted mt-1 text-xs leading-5">
                            {extra.pricingType === "FIXED"
                              ? `Cargo fijo de ${formatMoney(extra.price, config.branding.currency, config.branding.language)}`
                              : `${formatMoney(extra.price, config.branding.currency, config.branding.language)} por unidad`}
                          </p>
                          {quantity > 0 ? (
                            <p className="admin-muted mt-2 text-xs leading-5">
                              {extra.pricingType === "FIXED"
                                ? `Cargo actual: ${formatMoney(liveAmount, config.branding.currency, config.branding.language)}`
                                : `${billableQuantity} ${billableQuantity === 1 ? "unidad genera" : "unidades generan"} cargo.`}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex flex-col items-start gap-2 self-start sm:items-end sm:self-center">
                          {quantity > 0 ? (
                            <p className="text-sm font-semibold text-slate-900">
                              {formatMoney(
                                liveAmount,
                                config.branding.currency,
                                config.branding.language
                              )}
                            </p>
                          ) : null}
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => adjustExtra(extra.id, -1)}
                              className="admin-secondary inline-flex h-10 w-10 items-center justify-center text-lg font-semibold"
                              style={{
                                borderColor: modernTheme.badgeBorder,
                                background: modernTheme.badgeBackground,
                              }}
                            >
                              -
                            </button>
                            <span className="min-w-8 text-center text-sm font-semibold text-slate-900">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => adjustExtra(extra.id, 1)}
                              className="admin-secondary inline-flex h-10 w-10 items-center justify-center text-lg font-semibold"
                              style={{
                                borderColor: modernTheme.badgeBorder,
                                background: modernTheme.badgeBackground,
                              }}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {canUseManualAdjustments ? (
                <div
                  className="admin-surface rounded-3xl p-6 sm:p-8"
                  style={{
                    background: modernTheme.surfaceBackground,
                    borderColor: modernTheme.surfaceBorder,
                  }}
                >
                  <div className="flex flex-col gap-2">
                    <p className="admin-label text-sm font-medium">
                      Ajustes manuales
                    </p>
                    <p className="admin-muted text-sm leading-6">
                      Agrega conceptos temporales para esta cotización si el servicio o producto aún no existe en el sistema.
                    </p>
                  </div>

                  <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_auto]">
                    <input
                      value={manualLabel}
                      onChange={(event) => setManualLabel(event.target.value)}
                      placeholder="Ejemplo: Producto especial o servicio adicional"
                      className="admin-input px-4 py-3 text-sm"
                    />
                    <input
                      type="number"
                      min="0"
                      value={manualAmount}
                      onChange={(event) => setManualAmount(event.target.value)}
                      placeholder="Precio"
                      className="admin-input px-4 py-3 text-sm"
                    />
                    <button
                      type="button"
                      onClick={addManualAdjustment}
                      className="admin-primary w-full px-5 py-3 text-sm font-semibold lg:w-auto"
                    >
                      Agregar ajuste
                    </button>
                  </div>

                  {manualAdjustments.length > 0 ? (
                    <div className="mt-5 space-y-3">
                      {manualAdjustments.map((item) => (
                        <div
                          key={item.id}
                          className="admin-panel flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between"
                          style={{
                            background: modernTheme.panelBackground,
                            borderColor: modernTheme.panelBorder,
                          }}
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-950">{item.label}</p>
                            <p className="admin-muted mt-1 text-sm leading-6">
                              Ajuste manual visible solo en esta cotización.
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-slate-900">
                              {formatMoney(
                                item.amount,
                                config.branding.currency,
                                config.branding.language
                              )}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeManualAdjustment(item.id)}
                              className="rounded-xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600"
                            >
                              Quitar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </section>

            <aside className="space-y-6">
              <div
                ref={summaryRef}
                className="admin-surface rounded-3xl p-6 sm:p-8"
                style={{
                  background: modernTheme.summaryBackground,
                  borderColor: modernTheme.summaryBorder,
                }}
              >
                <p className="admin-label text-sm font-medium" style={{ color: modernTheme.badgeText }}>
                  {config.ui.titles.summaryTitle || "Resumen"}
                </p>

                {total === 0 ? (
                  <p className="admin-muted mt-4 text-sm leading-6">
                    {config.ui.texts.emptySummary ||
                      "Selecciona al menos una opción para comenzar."}
                  </p>
                ) : (
                  <>
                    <div className="mt-5 space-y-3 text-sm">
                      {selectedRows.map((row) => (
                        <div key={row.id} className="flex items-start justify-between gap-3">
                          <span className="text-slate-700">{row.label}</span>
                          <span className="font-semibold text-slate-900">
                            {formatMoney(
                              row.amount,
                              config.branding.currency,
                              config.branding.language
                            )}
                          </span>
                        </div>
                      ))}

                      {extraRows.map((row) => (
                        <div key={row.id} className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <span className="block text-slate-700">{row.label}</span>
                            {row.pricingType === "PER_UNIT" ? (
                              <span className="admin-muted mt-1 block text-xs leading-5">
                                {`Se cobran ${row.billableQuantity} de ${row.quantity} ${row.quantity === 1 ? "unidad" : "unidades"}.`}
                              </span>
                            ) : null}
                          </div>
                          <span className="shrink-0 font-semibold text-slate-900">
                            {formatMoney(
                              row.amount,
                              config.branding.currency,
                              config.branding.language
                            )}
                          </span>
                        </div>
                      ))}

                      {manualAdjustments.map((row) => (
                        <div key={row.id} className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <span className="block text-slate-700">{row.label}</span>
                            <span className="admin-muted mt-1 block text-xs leading-5">
                              Ajuste manual
                            </span>
                          </div>
                          <span className="shrink-0 font-semibold text-slate-900">
                            {formatMoney(
                              row.amount,
                              config.branding.currency,
                              config.branding.language
                            )}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 border-t border-[#efe6d8] pt-4">
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className="font-poppins text-xl font-semibold text-slate-950"
                          style={{ color: modernTheme.accentText }}
                        >
                          {config.ui.labels.total || "Total"}
                        </span>
                        <span
                          className="font-poppins text-3xl font-semibold text-slate-950"
                          style={{ color: modernTheme.accentText }}
                        >
                          {formatMoney(
                            total,
                            config.branding.currency,
                            config.branding.language
                          )}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={downloadSummary}
                  disabled={total === 0 || downloading}
                  className="admin-primary w-full px-5 py-3 text-sm font-semibold disabled:opacity-50"
                  style={{ background: modernTheme.primaryButton }}
                >
                  {downloading
                    ? "Generando imagen..."
                    : config.ui.labels.download || "Descargar cotización"}
                </button>
                <button
                  type="button"
                  onClick={resetQuote}
                  className="admin-secondary w-full px-5 py-3 text-sm font-semibold"
                >
                  {config.ui.labels.reset || "Nueva cotización"}
                </button>
              </div>
            </aside>
          </div>
        </div>
      </main>

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
