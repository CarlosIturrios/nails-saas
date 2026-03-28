import "server-only";

import {
  Prisma,
  QuoteItemType,
  QuoteStatus,
  ServiceOrderFlowType,
  ServiceOrderItemType,
  ServiceOrderStatus,
} from "@prisma/client";

import { prisma } from "@/src/lib/db";
import { resolveClientForCapture } from "@/src/lib/capture-clients";
import { createServiceOrderFromQuote } from "@/src/lib/service-orders";
import { getUtcTimestamp, parseNullableToUTC } from "@/src/lib/dates";

export interface CreateQuoteItemInput {
  itemType: QuoteItemType;
  label: string;
  description?: string | null;
  quantity?: number;
  unitPrice: number;
  total: number;
  metadata?: Record<string, unknown> | null;
}

export interface CreatePersistentQuoteInput {
  organizationId: string;
  clientId?: string | null;
  createdByUserId: string;
  status?: QuoteStatus;
  flowType: ServiceOrderFlowType;
  customerName?: string | null;
  customerPhone?: string | null;
  notes?: string | null;
  scheduledFor?: string | null;
  timeZone?: string | null;
  currency: string;
  source?: string;
  snapshot?: Record<string, unknown> | null;
  items: CreateQuoteItemInput[];
}

interface ConvertQuoteToServiceOrderOptions {
  assignedToUserId?: string | null;
  scheduledFor?: string | null;
  timeZone?: string | null;
}

function toInputJson(
  value: Record<string, unknown> | null | undefined
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return value ? (value as Prisma.InputJsonValue) : Prisma.JsonNull;
}

function normalizeMoney(value: number) {
  return Math.max(0, Math.round(value));
}

function normalizeQuantity(value: number | undefined) {
  if (!value || !Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.round(value));
}

async function resolveAssignedUserForQuoteConversion(input: {
  organizationId: string;
  assignedToUserId?: string | null;
}) {
  const assignedToUserId = input.assignedToUserId?.trim() || null;

  if (!assignedToUserId) {
    return null;
  }

  const membership = await prisma.userOrganization.findFirst({
    where: {
      organizationId: input.organizationId,
      userId: assignedToUserId,
      user: {
        active: true,
      },
    },
    select: {
      userId: true,
    },
  });

  if (!membership) {
    throw new Error("El responsable no pertenece a esta organización");
  }

  return membership.userId;
}

function buildQuoteStatusUpdate(
  current: {
    acceptedAt: Date | null;
    convertedAt: Date | null;
  },
  status: QuoteStatus
) {
  const now = new Date();

  switch (status) {
    case QuoteStatus.ACCEPTED:
      return {
        status,
        acceptedAt: current.acceptedAt ?? now,
      };
    case QuoteStatus.CONVERTED:
      return {
        status,
        acceptedAt: current.acceptedAt ?? now,
        convertedAt: current.convertedAt ?? now,
      };
    default:
      return { status };
  }
}

export async function createPersistentQuote(input: CreatePersistentQuoteInput) {
  const items = input.items
    .map((item, index) => {
      const quantity = normalizeQuantity(item.quantity);
      const unitPrice = normalizeMoney(item.unitPrice);
      const total = normalizeMoney(item.total);

      return {
        itemType: item.itemType,
        label: item.label.trim(),
        description: item.description?.trim() || null,
        quantity,
        unitPrice,
        total,
        sortOrder: index,
        metadata: toInputJson(item.metadata ?? null),
      };
    })
    .filter((item) => item.label.length > 0 && item.total > 0);

  if (items.length === 0) {
    throw new Error("Agrega al menos un concepto antes de guardar la propuesta");
  }

  const clientId = await resolveClientForCapture({
    organizationId: input.organizationId,
    clientId: input.clientId,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
  });
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const total = subtotal;

  return prisma.quote.create({
    data: {
      organizationId: input.organizationId,
      clientId,
      createdByUserId: input.createdByUserId,
      status: input.status ?? QuoteStatus.DRAFT,
      flowType: input.flowType,
      customerName: input.customerName?.trim() || null,
      customerPhone: input.customerPhone?.trim() || null,
      notes: input.notes?.trim() || null,
      scheduledFor:
        input.flowType === ServiceOrderFlowType.SCHEDULED
          ? parseNullableToUTC(input.scheduledFor, input.timeZone ?? undefined)
          : null,
      subtotal,
      total,
      currency: input.currency.trim() || "MXN",
      source: input.source?.trim() || "quote_calculator_v2",
      snapshot: toInputJson(input.snapshot ?? null),
      items: {
        create: items,
      },
    },
    include: {
      items: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      client: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      serviceOrders: {
        select: {
          id: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });
}

export async function listQuotesForOrganization(
  organizationId: string,
  options: {
    from?: Date | null;
    to?: Date | null;
    statuses?: QuoteStatus[];
    limit?: number;
  } = {}
) {
  const where: Prisma.QuoteWhereInput = {
    organizationId,
  };

  if (options.statuses && options.statuses.length > 0) {
    where.status = {
      in: options.statuses,
    };
  }

  if (options.from && options.to) {
    where.OR = [
      {
        scheduledFor: {
          gte: options.from,
          lte: options.to,
        },
      },
      {
        scheduledFor: null,
        createdAt: {
          gte: options.from,
          lte: options.to,
        },
      },
    ];
  }

  return prisma.quote.findMany({
    where,
    include: {
      items: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      client: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      serviceOrders: {
        select: {
          id: true,
          status: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
    orderBy: [
      {
        updatedAt: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    take: options.limit ?? 300,
  });
}

export async function getQuoteById(organizationId: string, quoteId: string) {
  const quote = await prisma.quote.findFirst({
    where: {
      id: quoteId,
      organizationId,
    },
    include: {
      items: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      client: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      serviceOrders: {
        select: {
          id: true,
          status: true,
          createdAt: true,
          clientId: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });

  if (!quote) {
    throw new Error("La propuesta no existe o no pertenece a tu organización");
  }

  return quote;
}

export async function updateQuoteStatus(
  organizationId: string,
  quoteId: string,
  status: QuoteStatus
) {
  const quote = await prisma.quote.findFirst({
    where: {
      id: quoteId,
      organizationId,
    },
    select: {
      id: true,
      acceptedAt: true,
      convertedAt: true,
    },
  });

  if (!quote) {
    throw new Error("La propuesta no existe o no pertenece a tu organización");
  }

  if (quote.convertedAt && status !== QuoteStatus.CONVERTED) {
    throw new Error("La propuesta ya fue convertida y no puede cambiar de estado");
  }

  return prisma.quote.update({
    where: {
      id: quoteId,
    },
    data: buildQuoteStatusUpdate(quote, status),
  });
}

export async function convertQuoteToServiceOrder(
  organizationId: string,
  quoteId: string,
  createdByUserId: string,
  options: ConvertQuoteToServiceOrderOptions = {}
) {
  const quote = await prisma.quote.findFirst({
    where: {
      id: quoteId,
      organizationId,
    },
    include: {
      items: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      serviceOrders: {
        select: {
          id: true,
        },
        take: 1,
      },
    },
  });

  if (!quote) {
    throw new Error("La propuesta no existe o no pertenece a tu organización");
  }

  if (quote.serviceOrders.length > 0 || quote.convertedAt) {
    throw new Error("La propuesta ya fue convertida a una orden");
  }

  const assignedToUserId = await resolveAssignedUserForQuoteConversion({
    organizationId,
    assignedToUserId: options.assignedToUserId,
  });
  const nextScheduledFor = options.scheduledFor?.trim() || null;
  const flowType = nextScheduledFor
    ? ServiceOrderFlowType.SCHEDULED
    : quote.scheduledFor
      ? ServiceOrderFlowType.SCHEDULED
      : quote.flowType;

  const order = await createServiceOrderFromQuote({
    organizationId,
    createdByUserId,
    clientId: quote.clientId,
    sourceQuoteId: quote.id,
    assignedToUserId,
    status: ServiceOrderStatus.CONFIRMED,
    flowType,
    customerName: quote.customerName,
    customerPhone: quote.customerPhone,
    notes: quote.notes,
    scheduledFor: nextScheduledFor || quote.scheduledFor?.toISOString() || null,
    timeZone: options.timeZone ?? null,
    currency: quote.currency,
    source: quote.source,
    snapshot:
      quote.snapshot && typeof quote.snapshot === "object" && !Array.isArray(quote.snapshot)
        ? (quote.snapshot as Record<string, unknown>)
        : null,
    items: quote.items.map((item) => ({
      itemType:
        item.itemType === QuoteItemType.EXTRA
          ? ServiceOrderItemType.EXTRA
          : item.itemType === QuoteItemType.ADJUSTMENT
            ? ServiceOrderItemType.ADJUSTMENT
            : ServiceOrderItemType.SERVICE,
      label: item.label,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
      metadata:
        item.metadata && typeof item.metadata === "object" && !Array.isArray(item.metadata)
          ? (item.metadata as Record<string, unknown>)
          : null,
    })),
  });

  await prisma.quote.update({
    where: {
      id: quote.id,
    },
    data: buildQuoteStatusUpdate(
      {
        acceptedAt: quote.acceptedAt,
        convertedAt: quote.convertedAt,
      },
      QuoteStatus.CONVERTED
    ),
  });

  return order;
}

export async function searchClientsForQuoteAssistant(
  organizationId: string,
  query: string,
  options: {
    limit?: number;
  } = {}
) {
  const normalizedQuery = query.trim();

  if (normalizedQuery.length < 2) {
    return [];
  }

  const clients = await prisma.client.findMany({
    where: {
      organizationId,
      OR: [
        {
          name: {
            contains: normalizedQuery,
            mode: Prisma.QueryMode.insensitive,
          },
        },
        {
          phone: {
            contains: normalizedQuery,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      ],
    },
    include: {
      _count: {
        select: {
          quotes: true,
          serviceOrders: true,
        },
      },
      quotes: {
        select: {
          total: true,
          createdAt: true,
          convertedAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      },
      serviceOrders: {
        select: {
          total: true,
          status: true,
          createdAt: true,
          paidAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: options.limit ?? 8,
  });

  return clients.map((client) => {
    const paidOrders = client.serviceOrders.filter((order) => order.status === ServiceOrderStatus.PAID);
    const lastActivityAt = [
      ...client.quotes.map((quote) => quote.convertedAt ?? quote.createdAt),
      ...client.serviceOrders.map((order) => order.paidAt ?? order.createdAt),
    ]
      .filter(Boolean)
      .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

    return {
      id: client.id,
      name: client.name,
      phone: client.phone === "SIN_TELEFONO" ? null : client.phone,
      email: client.email,
      quoteCount: client._count.quotes,
      orderCount: client._count.serviceOrders,
      totalPaid: paidOrders.reduce((sum, order) => sum + order.total, 0),
      lastActivityAt,
    };
  });
}

export async function listClientsWithCommercialHistory(
  organizationId: string,
  options: {
    limit?: number;
    includeWithoutHistory?: boolean;
  } = {}
) {
  const clients = await prisma.client.findMany({
    where: {
      organizationId,
    },
    include: {
      quotes: {
        select: {
          id: true,
          status: true,
          total: true,
          convertedAt: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      serviceOrders: {
        select: {
          id: true,
          status: true,
          total: true,
          paidAt: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: options.limit ?? 100,
  });

  return clients
    .map((client) => {
      const paidOrders = client.serviceOrders.filter((order) => order.status === ServiceOrderStatus.PAID);
      const activeQuotes = client.quotes.filter(
        (quote) =>
          quote.status !== QuoteStatus.CANCELLED &&
          quote.status !== QuoteStatus.EXPIRED
      );
      const timelineDates = [
        ...client.quotes.map((quote) => quote.convertedAt ?? quote.createdAt),
        ...client.serviceOrders.map((order) => order.paidAt ?? order.createdAt),
      ].filter(Boolean);

      const lastActivityAt =
        timelineDates.length > 0
          ? timelineDates.sort((a, b) => b.getTime() - a.getTime())[0]
          : null;

      return {
        id: client.id,
        name: client.name,
        phone: client.phone === "SIN_TELEFONO" ? null : client.phone,
        email: client.email,
        quoteCount: client.quotes.length,
        activeQuoteCount: activeQuotes.length,
        orderCount: client.serviceOrders.length,
        paidOrderCount: paidOrders.length,
        totalQuoted: activeQuotes.reduce((sum, quote) => sum + quote.total, 0),
        totalPaid: paidOrders.reduce((sum, order) => sum + order.total, 0),
        lastActivityAt,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
      };
    })
    .filter((client) =>
      options.includeWithoutHistory
        ? true
        : client.quoteCount > 0 || client.orderCount > 0
    )
    .sort((a, b) => {
      const aTime = Math.max(
        getUtcTimestamp(a.lastActivityAt),
        getUtcTimestamp(a.updatedAt),
        getUtcTimestamp(a.createdAt)
      );
      const bTime = Math.max(
        getUtcTimestamp(b.lastActivityAt),
        getUtcTimestamp(b.updatedAt),
        getUtcTimestamp(b.createdAt)
      );
      return bTime - aTime;
    })
    .map((client) => ({
      id: client.id,
      name: client.name,
      phone: client.phone,
      email: client.email,
      quoteCount: client.quoteCount,
      activeQuoteCount: client.activeQuoteCount,
      orderCount: client.orderCount,
      paidOrderCount: client.paidOrderCount,
      totalQuoted: client.totalQuoted,
      totalPaid: client.totalPaid,
      lastActivityAt: client.lastActivityAt,
    }));
}

export async function getClientCommercialHistory(
  organizationId: string,
  clientId: string
) {
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      organizationId,
    },
    include: {
      quotes: {
        include: {
          items: {
            orderBy: {
              sortOrder: "asc",
            },
          },
          serviceOrders: {
            select: {
              id: true,
              status: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 50,
      },
      serviceOrders: {
        include: {
          items: {
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 50,
      },
    },
  });

  if (!client) {
    throw new Error("El cliente no existe o no pertenece a tu organización");
  }

  const paidOrders = client.serviceOrders.filter((order) => order.status === ServiceOrderStatus.PAID);
  const activeQuotes = client.quotes.filter(
    (quote) =>
      quote.status !== QuoteStatus.CANCELLED &&
      quote.status !== QuoteStatus.EXPIRED
  );
  const timelineDates = [
    ...client.quotes.map((quote) => quote.convertedAt ?? quote.createdAt),
    ...client.serviceOrders.map((order) => order.paidAt ?? order.createdAt),
  ].filter(Boolean);

  const lastActivityAt =
    timelineDates.length > 0
      ? timelineDates.sort((a, b) => b.getTime() - a.getTime())[0]
      : null;

  return {
    id: client.id,
    name: client.name,
    phone: client.phone === "SIN_TELEFONO" ? null : client.phone,
    email: client.email,
    quoteCount: client.quotes.length,
    activeQuoteCount: activeQuotes.length,
    orderCount: client.serviceOrders.length,
    paidOrderCount: paidOrders.length,
    totalQuoted: activeQuotes.reduce((sum, quote) => sum + quote.total, 0),
    totalPaid: paidOrders.reduce((sum, order) => sum + order.total, 0),
    lastActivityAt,
    quotes: client.quotes,
    orders: client.serviceOrders,
  };
}
