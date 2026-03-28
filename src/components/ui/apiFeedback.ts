"use client";

type PermissionAction =
  | "create_quote"
  | "convert_quote"
  | "create_order"
  | "schedule_order"
  | "progress_order"
  | "charge_order"
  | "view_clients";

const DEFAULT_PERMISSION_MESSAGES: Record<PermissionAction, string> = {
  create_quote:
    "Tu perfil actual no puede guardar propuestas. Pide a un administrador que ajuste tus permisos.",
  convert_quote:
    "Tu perfil actual no puede convertir propuestas a órdenes. Pide a un administrador que ajuste tus permisos.",
  create_order:
    "Tu perfil actual no puede guardar órdenes. Pide a un administrador que ajuste tus permisos.",
  schedule_order:
    "Tu perfil actual no puede programar horarios ni responsables. Pide a un administrador que ajuste tus permisos.",
  progress_order:
    "Tu perfil actual no puede mover el trabajo. Pide a un administrador que ajuste tus permisos.",
  charge_order:
    "Tu perfil actual no puede cobrar órdenes. Pide a un administrador que ajuste tus permisos.",
  view_clients:
    "Tu perfil actual no puede consultar clientes. Pide a un administrador que ajuste tus permisos.",
};

export function getApiErrorMessage(params: {
  status?: number;
  payloadError?: unknown;
  fallback: string;
  permissionAction?: PermissionAction;
}) {
  const payloadError =
    typeof params.payloadError === "string" && params.payloadError.trim()
      ? params.payloadError.trim()
      : null;

  if (params.status === 403) {
    if (payloadError && payloadError !== "No autorizado") {
      return payloadError;
    }

    if (params.permissionAction) {
      return DEFAULT_PERMISSION_MESSAGES[params.permissionAction];
    }

    return "Tu perfil actual no puede realizar esta acción.";
  }

  return payloadError || params.fallback;
}
