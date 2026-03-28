"use client";

interface CaptureExperienceHeaderProps {
  kicker: string;
  businessName: string;
  organizationName: string;
  effectiveLogoUrl: string | null;
  primaryButtonColor: string;
  surfaceBackground: string;
  surfaceBorder: string;
  badgeText: string;
  title: string;
  description: string;
}

export function CaptureExperienceHeader({
  kicker,
  businessName,
  organizationName,
  effectiveLogoUrl,
  primaryButtonColor,
  surfaceBackground,
  surfaceBorder,
  badgeText,
  title,
  description,
}: CaptureExperienceHeaderProps) {
  return (
    <header
      className="admin-surface rounded-[28px] p-4 sm:p-6 lg:rounded-[32px] lg:p-8"
      style={{
        background: surfaceBackground,
        borderColor: surfaceBorder,
      }}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {effectiveLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={effectiveLogoUrl}
            alt={businessName}
            className="h-12 w-12 shrink-0 rounded-2xl border border-[#eadfcb] bg-white object-contain p-2 sm:h-14 sm:w-14"
          />
        ) : (
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-base font-semibold text-white sm:h-14 sm:w-14"
            style={{ backgroundColor: primaryButtonColor }}
          >
            {businessName.slice(0, 2).toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-950">{businessName}</p>
              <p className="truncate text-xs text-slate-500">{organizationName}</p>
            </div>
            <span
              className="inline-flex w-fit rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
              style={{
                borderColor: surfaceBorder,
                background: "rgba(255,255,255,0.72)",
                color: badgeText,
              }}
            >
              {kicker}
            </span>
          </div>

          <div className="mt-4">
            <h1 className="admin-title break-words font-poppins text-xl font-semibold text-slate-950 sm:text-2xl lg:text-3xl">
              {title}
            </h1>
            <p className="admin-muted mt-2 max-w-3xl text-sm leading-6">{description}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
