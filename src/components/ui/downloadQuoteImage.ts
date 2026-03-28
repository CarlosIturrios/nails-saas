"use client";

import html2canvas from "html2canvas";

interface QuoteImageBranding {
  businessName: string;
  organizationName: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  currency: string;
  language: string;
}

interface QuoteImageRow {
  label: string;
  amount: number;
  detail?: string;
}

interface DownloadQuoteImageInput {
  branding: QuoteImageBranding;
  title: string;
  subtitle?: string | null;
  totalLabel?: string | null;
  total: number;
  rows: QuoteImageRow[];
  isLegacyTemplate?: boolean;
  filename?: string;
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
      reader.onloadend = () =>
        resolve(typeof reader.result === "string" ? reader.result : normalized);
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

export async function downloadQuoteImage(input: DownloadQuoteImageInput) {
  const isLegacyTemplate = Boolean(input.isLegacyTemplate);
  const accentColor = input.branding.primaryColor || "#1f2937";
  const surfaceColor = input.branding.secondaryColor || "#fffaf4";
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

  if (input.branding.logoUrl) {
    const logo = document.createElement("img");
    logo.src = await resolveLogoSource(input.branding.logoUrl);
    logo.alt = input.branding.businessName;
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
    fallbackLogo.textContent = input.branding.businessName.slice(0, 2).toUpperCase();
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
  overline.textContent = input.branding.organizationName;
  overline.style.margin = isLegacyTemplate ? "0 0 10px 0" : "0 0 6px 0";
  overline.style.fontSize = "11px";
  overline.style.fontWeight = "700";
  overline.style.letterSpacing = "0.14em";
  overline.style.textTransform = "uppercase";
  overline.style.color = accentColor;
  headerText.appendChild(overline);

  const title = document.createElement("h2");
  title.textContent = input.title;
  title.style.margin = "0";
  title.style.fontSize = isLegacyTemplate ? "22px" : "28px";
  title.style.lineHeight = "1.2";
  title.style.color = accentColor;
  title.style.fontWeight = isLegacyTemplate ? "700" : "500";
  headerText.appendChild(title);

  if (!isLegacyTemplate && input.subtitle) {
    const subtitle = document.createElement("p");
    subtitle.textContent = input.subtitle;
    subtitle.style.margin = "12px 0 0 0";
    subtitle.style.fontSize = "14px";
    subtitle.style.lineHeight = "1.5";
    subtitle.style.color = "#475569";
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

  input.rows.forEach((row) => {
    addRow(
      row.label,
      formatMoney(row.amount, input.branding.currency, input.branding.language),
      row.detail
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
  totalLabel.textContent = `${input.totalLabel || "Total"}:`;
  totalLabel.style.fontSize = isLegacyTemplate ? "18px" : "20px";
  totalLabel.style.fontWeight = "700";
  totalLabel.style.color = accentColor;

  const totalValue = document.createElement("span");
  totalValue.textContent = formatMoney(
    input.total,
    input.branding.currency,
    input.branding.language
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
    link.download = input.filename || "cotizacion-v2.png";
    link.click();
  } finally {
    document.body.removeChild(tempDiv);
  }
}
