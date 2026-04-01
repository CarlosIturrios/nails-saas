import type { OperationalFrontendAccess } from "@/src/lib/authorization";

export const V2_ROUTES = {
  root: "/",
  capture: "/capturar",
  pending: "/pendientes",
  agenda: "/agenda",
  more: "/mas",
  clients: "/clientes",
  quotes: "/propuestas",
  orders: "/ordenes",
  cash: "/caja",
  dashboard: "/tablero",
} as const;

export function getDefaultAppRoute(access: OperationalFrontendAccess) {
  if (access.canUseNewSale) {
    return V2_ROUTES.capture;
  }

  if (access.canUsePending) {
    return V2_ROUTES.pending;
  }

  if (access.canUseAgenda) {
    return V2_ROUTES.agenda;
  }

  if (access.canUseClients) {
    return V2_ROUTES.clients;
  }

  if (access.canUseCash) {
    return V2_ROUTES.cash;
  }

  if (access.canUseQuotes) {
    return V2_ROUTES.quotes;
  }

  if (access.canUseOrders) {
    return V2_ROUTES.orders;
  }

  if (access.canUseDashboard) {
    return V2_ROUTES.dashboard;
  }

  return V2_ROUTES.more;
}

export function getV2ClientHref(id: string) {
  return `${V2_ROUTES.clients}/${id}`;
}

export function getV2QuoteHref(id: string) {
  return `${V2_ROUTES.quotes}/${id}`;
}

export function getV2OrderHref(id: string) {
  return `${V2_ROUTES.orders}/${id}`;
}

export function buildV2NewSaleHref(params: {
  clientId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  intent?: "quote" | "order" | "paid";
}) {
  const search = new URLSearchParams();

  if (params.clientId) {
    search.set("clientId", params.clientId);
  }
  if (params.customerName) {
    search.set("customerName", params.customerName);
  }
  if (params.customerPhone) {
    search.set("customerPhone", params.customerPhone);
  }
  if (params.intent) {
    search.set("intent", params.intent);
  }

  const query = search.toString();
  return query ? `${V2_ROUTES.capture}?${query}` : V2_ROUTES.capture;
}

export function buildV2CaptureEditQuoteHref(quoteId: string) {
  return buildRouteWithSearch(V2_ROUTES.capture, {
    editQuoteId: quoteId,
  });
}

export function buildV2CaptureEditOrderHref(orderId: string) {
  return buildRouteWithSearch(V2_ROUTES.capture, {
    editOrderId: orderId,
  });
}

export function buildRouteWithSearch(
  basePath: string,
  params: Record<string, string | null | undefined>
) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value && value.trim()) {
      search.set(key, value.trim());
    }
  }

  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}
