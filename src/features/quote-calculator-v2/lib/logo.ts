const MANICURIST_BUSINESS_TYPES = new Set([
  "manicurist",
  "nail_salon",
  "nails",
  "nail",
]);

export const MANICURIST_DEFAULT_LOGO = "/logo.png";
export const GENERIC_DEFAULT_LOGO = "/logo_default_no_manicurist.png";

export function getDefaultLogoForBusinessType(businessType?: string | null) {
  const normalized = businessType?.trim().toLowerCase() ?? "";

  if (MANICURIST_BUSINESS_TYPES.has(normalized)) {
    return MANICURIST_DEFAULT_LOGO;
  }

  return GENERIC_DEFAULT_LOGO;
}

export function getEffectiveLogoUrl(params: {
  businessType?: string | null;
  logoUrl?: string | null;
}) {
  const normalizedLogo = params.logoUrl?.trim();

  if (normalizedLogo) {
    return normalizedLogo;
  }

  return getDefaultLogoForBusinessType(params.businessType);
}
