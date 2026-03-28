"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { sanitizeTimezone, type TimezoneSource } from "@/src/lib/dates";

interface TimezoneRuntimeProps {
  userTimezone: string | null;
  detectedTimezone: string | null;
  organizationTimezone: string;
  resolvedTimezone: string;
  source: TimezoneSource;
  showBanner?: boolean;
}

function getSourceLabel(source: TimezoneSource) {
  if (source === "user") {
    return "Perfil";
  }

  if (source === "device") {
    return "Dispositivo";
  }

  if (source === "organization") {
    return "Organización";
  }

  return "UTC";
}

function detectDeviceTimezone() {
  if (typeof window === "undefined") {
    return null;
  }

  return sanitizeTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
}

export function TimezoneRuntime({
  userTimezone,
  detectedTimezone,
  organizationTimezone,
  resolvedTimezone,
  source,
  showBanner = true,
}: TimezoneRuntimeProps) {
  const router = useRouter();
  const [liveDetectedTimezone, setLiveDetectedTimezone] = useState(detectedTimezone);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const nextDetectedTimezone = detectDeviceTimezone();

    if (!nextDetectedTimezone) {
      return;
    }

    if (nextDetectedTimezone === detectedTimezone) {
      return;
    }

    void fetch("/api/preferences/timezone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ detectedTimezone: nextDetectedTimezone }),
    })
      .then(async (response) => {
        if (!response.ok) {
          return;
        }

        setLiveDetectedTimezone(nextDetectedTimezone);

        if (!userTimezone && nextDetectedTimezone !== resolvedTimezone) {
          router.refresh();
        }
      })
      .catch(() => undefined);
  }, [detectedTimezone, resolvedTimezone, router, userTimezone]);

  const banner = useMemo(() => {
    if (!showBanner || dismissed) {
      return null;
    }

    if (!userTimezone && liveDetectedTimezone) {
      return {
        title: `Detectamos tu zona: ${liveDetectedTimezone}`,
        description: `La app está usando ${getSourceLabel(source).toLowerCase()} para mostrar horarios y calcular cortes. Puedes fijarla o dejarla automática.`,
      };
    }

    if (userTimezone && liveDetectedTimezone && userTimezone !== liveDetectedTimezone) {
      return {
        title: `Tu perfil usa ${userTimezone}`,
        description: `Tu dispositivo reporta ${liveDetectedTimezone}. Esto es útil si estás viajando y quieres decidir si dejas la zona fija o automática.`,
      };
    }

    if (!userTimezone && !liveDetectedTimezone && resolvedTimezone === organizationTimezone) {
      return {
        title: `Se está usando la zona de la organización: ${organizationTimezone}`,
        description:
          "No detectamos una zona del dispositivo, así que la app cayó al fallback de la organización.",
      };
    }

    return null;
  }, [
    dismissed,
    liveDetectedTimezone,
    organizationTimezone,
    resolvedTimezone,
    showBanner,
    source,
    userTimezone,
  ]);

  if (!banner) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-[#d7e5f6] bg-[#f6fbff] px-4 py-3 text-sm text-slate-700">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-semibold text-slate-900">{banner.title}</p>
          <p className="mt-1 leading-6 text-slate-600">{banner.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/mas#zona-horaria"
            className="inline-flex items-center justify-center rounded-xl border border-[#d7e5f6] bg-white px-3 py-2 text-sm font-semibold text-slate-700"
          >
            Revisar zona
          </Link>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="inline-flex items-center justify-center rounded-xl border border-transparent px-3 py-2 text-sm font-semibold text-slate-500"
          >
            Ocultar
          </button>
        </div>
      </div>
    </div>
  );
}
