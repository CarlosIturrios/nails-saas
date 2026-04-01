import { QuoteStatus, ServiceOrderStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { resolveOperationsDateRange } from "@/src/features/v2/lib/filters";
import { getOperationalFrontendAccess } from "@/src/lib/authorization";
import { formatDate } from "@/src/lib/dates";
import { getOrganizationContextFromRequest } from "@/src/lib/organizations/context";
import { listQuotesForOrganization } from "@/src/lib/quotes";
import { listServiceOrdersForOrganization } from "@/src/lib/service-orders";

interface RouteContext {
  params: Promise<{
    module: string;
  }>;
}

const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  DRAFT: "Borrador",
  SENT: "Enviada",
  ACCEPTED: "Aceptada",
  CONVERTED: "Convertida",
  CANCELLED: "Cancelada",
  EXPIRED: "Expirada",
};

const ORDER_STATUS_LABELS: Record<ServiceOrderStatus, string> = {
  DRAFT: "Borrador",
  CONFIRMED: "Pendiente",
  IN_PROGRESS: "En proceso",
  COMPLETED: "Terminada",
  PAID: "Pagada",
  CANCELLED: "Cancelada",
};

function csvEscape(value: unknown) {
  const normalized =
    value === null || value === undefined
      ? ""
      : Array.isArray(value)
        ? value.join(" | ")
        : String(value);

  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }

  return normalized;
}

function buildCsv(rows: unknown[][]) {
  return `\uFEFF${rows.map((row) => row.map(csvEscape).join(",")).join("\n")}`;
}

function normalizeSearch(value: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

function formatDateTime(value: Date | string | null, timeZone: string) {
  if (!value) {
    return "";
  }

  return formatDate(value, {
    locale: "es-MX",
    timeZone,
    dateStyle: "medium",
    timeStyle: "short",
  });
}

interface ExportFilenameRange {
  preset: "day" | "week" | "month" | "custom" | "all";
  from: string | null;
  to: string | null;
}

function buildFilename(
  module: "quotes" | "orders" | "pending",
  range: ExportFilenameRange
) {
  if (range.preset === "all") {
    return `${module}-todo.csv`;
  }

  const suffix =
    range.from && range.to && range.from !== range.to
      ? `${range.from}_a_${range.to}`
      : range.from ?? range.to ?? "rango";

  return `${module}-${suffix}.csv`;
}

function matchesQuoteStatus(statusFilter: string | null, status: QuoteStatus) {
  if (!statusFilter || statusFilter === "all") {
    return true;
  }

  if (statusFilter === "open") {
    return status !== QuoteStatus.CONVERTED && status !== QuoteStatus.CANCELLED;
  }

  if (statusFilter === "closed") {
    return status === QuoteStatus.CONVERTED || status === QuoteStatus.CANCELLED;
  }

  return status === statusFilter;
}

function matchesOrderStatus(statusFilter: string | null, status: ServiceOrderStatus) {
  if (!statusFilter || statusFilter === "all") {
    return true;
  }

  if (statusFilter === "open") {
    return status !== ServiceOrderStatus.PAID && status !== ServiceOrderStatus.CANCELLED;
  }

  if (statusFilter === "closed") {
    return status === ServiceOrderStatus.PAID || status === ServiceOrderStatus.CANCELLED;
  }

  return status === statusFilter;
}

type QuoteListItem = Awaited<ReturnType<typeof listQuotesForOrganization>>[number];
type OrderListItem = Awaited<ReturnType<typeof listServiceOrdersForOrganization>>[number];

function buildQuoteHaystack(quote: QuoteListItem) {
  return [
    quote.customerName,
    quote.customerPhone,
    quote.notes,
    ...quote.items.map((item) => item.label),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function buildOrderHaystack(order: OrderListItem) {
  const assignedToName = order.assignedTo
    ? `${order.assignedTo.firstName} ${order.assignedTo.lastName}`.trim()
    : null;

  return [
    order.customerName,
    order.customerPhone,
    order.notes,
    assignedToName,
    ...order.items.map((item) => item.label),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getQuoteNextStep(quote: QuoteListItem) {
  if (quote.status === QuoteStatus.ACCEPTED && !quote.serviceOrders[0]?.id) {
    return "Convertir en orden";
  }

  if (quote.status === QuoteStatus.DRAFT || quote.status === QuoteStatus.SENT) {
    return "Dar seguimiento";
  }

  if (quote.serviceOrders[0]?.id) {
    return "Ver orden ligada";
  }

  return "Revisar";
}

function getOrderNextStep(order: OrderListItem) {
  if (order.status === ServiceOrderStatus.DRAFT) {
    return "Confirmar";
  }

  if (order.status === ServiceOrderStatus.CONFIRMED) {
    return "Iniciar";
  }

  if (order.status === ServiceOrderStatus.IN_PROGRESS) {
    return "Terminar";
  }

  if (order.status === ServiceOrderStatus.COMPLETED) {
    return "Cobrar";
  }

  return "Revisar";
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const [{ module }, organizationContext] = await Promise.all([
      context.params,
      getOrganizationContextFromRequest(),
    ]);

    if (!organizationContext.currentOrganizationId) {
      return NextResponse.json(
        { error: "Selecciona una organización antes de continuar" },
        { status: 400 }
      );
    }

    const access = getOperationalFrontendAccess(
      organizationContext.user.role,
      organizationContext.currentOrganizationRole,
      organizationContext.currentOrganizationPermissionProfile
    );
    const timeZone =
      organizationContext.currentTimezone?.timezone ??
      organizationContext.currentOrganization?.defaultTimezone ??
      "UTC";
    const searchParams = new URL(request.url).searchParams;
    const range = resolveOperationsDateRange(
      {
        preset: searchParams.get("preset"),
        date: searchParams.get("date"),
        from: searchParams.get("from"),
        to: searchParams.get("to"),
      },
      timeZone
    );
    const searchQuery = normalizeSearch(searchParams.get("q"));
    const limit = range.preset === "all" ? 5000 : 2000;

    if (module === "quotes") {
      if (!access.canUseQuotes) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }

      const statusFilter = searchParams.get("status");
      const quotes = await listQuotesForOrganization(organizationContext.currentOrganizationId, {
        from: range.start,
        to: range.end,
        limit,
      });
      const rows = quotes
        .filter(
          (quote) =>
            matchesQuoteStatus(statusFilter, quote.status) &&
            (!searchQuery || buildQuoteHaystack(quote).includes(searchQuery))
        )
        .map((quote) => [
          quote.id,
          QUOTE_STATUS_LABELS[quote.status],
          quote.customerName ?? quote.client?.name ?? "",
          quote.customerPhone ??
            (quote.client?.phone && quote.client.phone !== "SIN_TELEFONO"
              ? quote.client.phone
              : ""),
          formatDateTime(quote.createdAt, timeZone),
          formatDateTime(quote.scheduledFor, timeZone),
          quote.total,
          quote.currency,
          quote.serviceOrders[0]?.id ?? "",
          getQuoteNextStep(quote),
          quote.notes ?? "",
          quote.items.map((item) => item.label),
        ]);

      return new Response(
        buildCsv([
          [
            "id",
            "estado",
            "cliente",
            "telefono",
            "creada",
            "programada",
            "total",
            "moneda",
            "orden_ligada",
            "siguiente_paso",
            "nota",
            "conceptos",
          ],
          ...rows,
        ]),
        {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${buildFilename("quotes", range)}"`,
            "Cache-Control": "no-store",
          },
        }
      );
    }

    if (module === "orders") {
      if (!access.canUseOrders) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }

      const statusFilter = searchParams.get("status");
      const orders = await listServiceOrdersForOrganization(
        organizationContext.currentOrganizationId,
        {
          from: range.start,
          to: range.end,
          limit,
        }
      );
      const rows = orders
        .filter(
          (order) =>
            matchesOrderStatus(statusFilter, order.status) &&
            (!searchQuery || buildOrderHaystack(order).includes(searchQuery))
        )
        .map((order) => [
          order.id,
          ORDER_STATUS_LABELS[order.status],
          order.customerName ?? order.client?.name ?? "",
          order.customerPhone ??
            (order.client?.phone && order.client.phone !== "SIN_TELEFONO"
              ? order.client.phone
              : ""),
          order.flowType === "SCHEDULED" ? "Agendada" : "Inmediata",
          formatDateTime(order.createdAt, timeZone),
          formatDateTime(order.scheduledFor, timeZone),
          order.total,
          order.currency,
          order.assignedTo
            ? `${order.assignedTo.firstName} ${order.assignedTo.lastName}`.trim()
            : "",
          order.sourceQuoteId ?? "",
          getOrderNextStep(order),
          order.notes ?? "",
          order.items.map((item) => item.label),
        ]);

      return new Response(
        buildCsv([
          [
            "id",
            "estado",
            "cliente",
            "telefono",
            "tipo_atencion",
            "creada",
            "programada",
            "total",
            "moneda",
            "responsable",
            "propuesta_origen",
            "siguiente_paso",
            "nota",
            "conceptos",
          ],
          ...rows,
        ]),
        {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${buildFilename("orders", range)}"`,
            "Cache-Control": "no-store",
          },
        }
      );
    }

    if (module === "pending") {
      if (!access.canUsePending) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }

      const quoteStatusFilter = searchParams.get("quoteStatus");
      const orderStatusFilter = searchParams.get("orderStatus");
      const [quotes, orders] = await Promise.all([
        listQuotesForOrganization(organizationContext.currentOrganizationId, {
          from: range.start,
          to: range.end,
          limit,
        }),
        listServiceOrdersForOrganization(organizationContext.currentOrganizationId, {
          from: range.start,
          to: range.end,
          limit,
        }),
      ]);
      const quoteRows = quotes
        .filter(
          (quote) =>
            matchesQuoteStatus(quoteStatusFilter, quote.status) &&
            (!searchQuery || buildQuoteHaystack(quote).includes(searchQuery))
        )
        .map((quote) => [
          "propuesta",
          quote.id,
          QUOTE_STATUS_LABELS[quote.status],
          quote.customerName ?? quote.client?.name ?? "",
          quote.customerPhone ??
            (quote.client?.phone && quote.client.phone !== "SIN_TELEFONO"
              ? quote.client.phone
              : ""),
          formatDateTime(quote.createdAt, timeZone),
          formatDateTime(quote.scheduledFor, timeZone),
          quote.total,
          quote.currency,
          "",
          quote.serviceOrders[0]?.id ?? "",
          getQuoteNextStep(quote),
          quote.notes ?? "",
          quote.items.map((item) => item.label),
        ]);
      const orderRows = orders
        .filter(
          (order) =>
            matchesOrderStatus(orderStatusFilter, order.status) &&
            (!searchQuery || buildOrderHaystack(order).includes(searchQuery))
        )
        .map((order) => [
          "orden",
          order.id,
          ORDER_STATUS_LABELS[order.status],
          order.customerName ?? order.client?.name ?? "",
          order.customerPhone ??
            (order.client?.phone && order.client.phone !== "SIN_TELEFONO"
              ? order.client.phone
              : ""),
          formatDateTime(order.createdAt, timeZone),
          formatDateTime(order.scheduledFor, timeZone),
          order.total,
          order.currency,
          order.assignedTo
            ? `${order.assignedTo.firstName} ${order.assignedTo.lastName}`.trim()
            : "",
          order.sourceQuoteId ?? "",
          getOrderNextStep(order),
          order.notes ?? "",
          order.items.map((item) => item.label),
        ]);

      return new Response(
        buildCsv([
          [
            "tipo",
            "id",
            "estado",
            "cliente",
            "telefono",
            "creada",
            "programada",
            "total",
            "moneda",
            "responsable",
            "relacion",
            "siguiente_paso",
            "nota",
            "conceptos",
          ],
          ...quoteRows,
          ...orderRows,
        ]),
        {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${buildFilename("pending", range)}"`,
            "Cache-Control": "no-store",
          },
        }
      );
    }

    return NextResponse.json({ error: "Reporte no soportado" }, { status: 404 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Error generando el reporte",
      },
      { status: 400 }
    );
  }
}
