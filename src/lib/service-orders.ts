import "server-only";

import {
  Prisma,
  ServiceOrderFlowType,
  ServiceOrderItemType,
  ServiceOrderStatus,
} from "@prisma/client";

import { prisma } from "@/src/lib/db";
import { resolveClientForCapture } from "@/src/lib/capture-clients";
import {
  endOfDay,
  getCalendarDateInTimezone,
  getUtcTimestamp,
  parseNullableToUTC,
  startOfDay,
} from "@/src/lib/dates";
import { getServiceOrderRescheduleDeniedMessage } from "@/src/lib/service-order-rules";

export interface CreateServiceOrderItemInput {
  itemType: ServiceOrderItemType;
  label: string;
  description?: string | null;
  quantity?: number;
  unitPrice: number;
  total: number;
  metadata?: Record<string, unknown> | null;
}

export interface CreateServiceOrderFromQuoteInput {
  organizationId: string;
  clientId?: string | null;
  createdByUserId: string;
  sourceQuoteId?: string | null;
  assignedToUserId?: string | null;
  status: ServiceOrderStatus;
  flowType: ServiceOrderFlowType;
  customerName?: string | null;
  customerPhone?: string | null;
  notes?: string | null;
  scheduledFor?: string | null;
  timeZone?: string | null;
  currency: string;
  source?: string;
  snapshot?: Record<string, unknown> | null;
  items: CreateServiceOrderItemInput[];
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

function buildStatusUpdate(
  current: {
    startedAt: Date | null;
    completedAt: Date | null;
    paidAt: Date | null;
  },
  status: ServiceOrderStatus
) {
  const now = new Date();

  switch (status) {
    case ServiceOrderStatus.IN_PROGRESS:
      return {
        status,
        startedAt: current.startedAt ?? now,
      };
    case ServiceOrderStatus.COMPLETED:
      return {
        status,
        startedAt: current.startedAt,
        completedAt: current.completedAt ?? now,
      };
    case ServiceOrderStatus.PAID:
      return {
        status,
        startedAt: current.startedAt,
        completedAt: current.completedAt ?? now,
        paidAt: current.paidAt ?? now,
      };
    default:
      return { status };
  }
}

async function resolveAssignedUserForOrder(input: {
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

export async function createServiceOrderFromQuote(
  input: CreateServiceOrderFromQuoteInput
) {
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
    throw new Error("Agrega al menos un concepto antes de guardar la orden");
  }

  const clientId = await resolveClientForCapture({
    organizationId: input.organizationId,
    clientId: input.clientId,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
  });
  const assignedToUserId = await resolveAssignedUserForOrder({
    organizationId: input.organizationId,
    assignedToUserId: input.assignedToUserId,
  });
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const total = subtotal;

  return prisma.serviceOrder.create({
    data: {
      organizationId: input.organizationId,
      clientId,
      sourceQuoteId: input.sourceQuoteId?.trim() || null,
      createdByUserId: input.createdByUserId,
      assignedToUserId,
      status: input.status,
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
    },
  });
}

export async function listServiceOrdersForOrganization(
  organizationId: string,
  options: {
    date?: Date;
    from?: Date | null;
    to?: Date | null;
    timeZone?: string;
    statuses?: ServiceOrderStatus[];
    limit?: number;
  } = {}
) {
  const where: Prisma.ServiceOrderWhereInput = {
    organizationId,
  };

  if (options.statuses && options.statuses.length > 0) {
    where.status = {
      in: options.statuses,
    };
  }

  let start = options.from ?? null;
  let end = options.to ?? null;

  if ((!start || !end) && options.date) {
    if (options.timeZone) {
      const calendarDate = getCalendarDateInTimezone(options.date, options.timeZone);
      start = startOfDay(calendarDate, options.timeZone);
      end = endOfDay(calendarDate, options.timeZone);
    } else {
      start = new Date(options.date);
      start.setHours(0, 0, 0, 0);

      end = new Date(options.date);
      end.setHours(23, 59, 59, 999);
    }
  }

  if (start && end) {
    where.OR = [
      {
        scheduledFor: {
          gte: start,
          lte: end,
        },
      },
      {
        scheduledFor: null,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    ];
  }

  return prisma.serviceOrder.findMany({
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
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: [
      {
        scheduledFor: "asc",
      },
      {
        createdAt: "desc",
      },
    ],
    take: options.limit ?? 300,
  });
}

export async function getServiceOrderById(
  organizationId: string,
  serviceOrderId: string
) {
  const order = await prisma.serviceOrder.findFirst({
    where: {
      id: serviceOrderId,
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
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      sourceQuote: {
        select: {
          id: true,
          status: true,
          clientId: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error("La orden no existe o no pertenece a tu organización");
  }

  return order;
}

export async function getServiceOrderCashSummary(
  organizationId: string,
  options: {
    date?: Date;
    from?: Date | null;
    to?: Date | null;
    timeZone?: string;
    limit?: number;
  } = {}
) {
  const orders = await listServiceOrdersForOrganization(organizationId, options);

  const paidStatuses = new Set<ServiceOrderStatus>([ServiceOrderStatus.PAID]);
  const pendingStatuses = new Set<ServiceOrderStatus>([
    ServiceOrderStatus.CONFIRMED,
    ServiceOrderStatus.IN_PROGRESS,
    ServiceOrderStatus.COMPLETED,
    ServiceOrderStatus.DRAFT,
  ]);

  const paidOrders = orders.filter((order) => paidStatuses.has(order.status));
  const pendingOrders = orders.filter((order) => pendingStatuses.has(order.status));
  const cancelledOrders = orders.filter((order) => order.status === ServiceOrderStatus.CANCELLED);

  return {
    orders,
    totals: {
      totalOrders: orders.length,
      paidCount: paidOrders.length,
      pendingCount: pendingOrders.length,
      cancelledCount: cancelledOrders.length,
      paidAmount: paidOrders.reduce((sum, order) => sum + order.total, 0),
      pendingAmount: pendingOrders.reduce((sum, order) => sum + order.total, 0),
      cancelledAmount: cancelledOrders.reduce((sum, order) => sum + order.total, 0),
    },
    paidOrders,
    pendingOrders,
    cancelledOrders,
  };
}

export async function updateServiceOrderStatus(
  organizationId: string,
  serviceOrderId: string,
  status: ServiceOrderStatus
) {
  const order = await prisma.serviceOrder.findFirst({
    where: {
      id: serviceOrderId,
      organizationId,
    },
    select: {
      id: true,
      startedAt: true,
      completedAt: true,
      paidAt: true,
    },
  });

  if (!order) {
    throw new Error("La orden no existe o no pertenece a tu organización");
  }

  return prisma.serviceOrder.update({
    where: {
      id: serviceOrderId,
    },
    data: buildStatusUpdate(order, status),
  });
}

export async function updateServiceOrderSchedule(
  organizationId: string,
  serviceOrderId: string,
  scheduledFor: string | null,
  timeZone?: string | null
) {
  const order = await prisma.serviceOrder.findFirst({
    where: {
      id: serviceOrderId,
      organizationId,
    },
    select: {
      id: true,
      status: true,
      startedAt: true,
      completedAt: true,
      paidAt: true,
    },
  });

  if (!order) {
    throw new Error("La orden no existe o no pertenece a tu organización");
  }

  const deniedMessage = getServiceOrderRescheduleDeniedMessage(order);

  if (deniedMessage) {
    throw new Error(deniedMessage);
  }

  const nextScheduledFor = parseNullableToUTC(
    scheduledFor?.trim() || null,
    timeZone ?? undefined
  );

  if (nextScheduledFor && Number.isNaN(nextScheduledFor.getTime())) {
    throw new Error("La fecha programada no es válida");
  }

  return prisma.serviceOrder.update({
    where: {
      id: serviceOrderId,
    },
    data: {
      flowType: nextScheduledFor
        ? ServiceOrderFlowType.SCHEDULED
        : ServiceOrderFlowType.WALK_IN,
      scheduledFor: nextScheduledFor,
    },
  });
}

export async function listAssignableUsersForOrganization(organizationId: string) {
  const memberships = await prisma.userOrganization.findMany({
    where: {
      organizationId,
      user: {
        active: true,
      },
    },
    select: {
      userId: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: [
      {
        user: {
          firstName: "asc",
        },
      },
      {
        user: {
          lastName: "asc",
        },
      },
    ],
  });

  return memberships.map((membership) => ({
    id: membership.user.id,
    name: `${membership.user.firstName} ${membership.user.lastName}`.trim(),
    email: membership.user.email,
    role: membership.user.role,
  }));
}

export async function updateServiceOrderAssignment(
  organizationId: string,
  serviceOrderId: string,
  assignedToUserId: string | null
) {
  const order = await prisma.serviceOrder.findFirst({
    where: {
      id: serviceOrderId,
      organizationId,
    },
    select: {
      id: true,
    },
  });

  if (!order) {
    throw new Error("La orden no existe o no pertenece a tu organización");
  }

  const nextAssignedToUserId = await resolveAssignedUserForOrder({
    organizationId,
    assignedToUserId,
  });

  return prisma.serviceOrder.update({
    where: {
      id: serviceOrderId,
    },
    data: {
      assignedToUserId: nextAssignedToUserId,
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
}

export async function listClientsWithOrderHistory(
  organizationId: string,
  options: {
    limit?: number;
  } = {}
) {
  const clients = await prisma.client.findMany({
    where: {
      organizationId,
    },
    include: {
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

      return {
        id: client.id,
        name: client.name,
        phone: client.phone === "SIN_TELEFONO" ? null : client.phone,
        email: client.email,
        orderCount: client.serviceOrders.length,
        paidOrderCount: paidOrders.length,
        totalPaid: paidOrders.reduce((sum, order) => sum + order.total, 0),
        lastOrderAt:
          client.serviceOrders[0]?.paidAt ??
          client.serviceOrders[0]?.createdAt ??
          null,
      };
    })
    .filter((client) => client.orderCount > 0)
    .sort((a, b) => {
      const aTime = getUtcTimestamp(a.lastOrderAt);
      const bTime = getUtcTimestamp(b.lastOrderAt);
      return bTime - aTime;
    });
}

export async function getClientOrderHistory(
  organizationId: string,
  clientId: string
) {
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      organizationId,
    },
    include: {
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

  return {
    id: client.id,
    name: client.name,
    phone: client.phone === "SIN_TELEFONO" ? null : client.phone,
    email: client.email,
    orderCount: client.serviceOrders.length,
    paidOrderCount: paidOrders.length,
    totalPaid: paidOrders.reduce((sum, order) => sum + order.total, 0),
    lastOrderAt:
      client.serviceOrders[0]?.paidAt ??
      client.serviceOrders[0]?.createdAt ??
      null,
    orders: client.serviceOrders,
  };
}

export async function getResponsibleOperationalDashboard(
  organizationId: string,
  options: {
    date?: Date;
    from?: Date | null;
    to?: Date | null;
    timeZone?: string;
    limit?: number;
  } = {}
) {
  const [orders, assignableUsers] = await Promise.all([
    listServiceOrdersForOrganization(organizationId, options),
    listAssignableUsersForOrganization(organizationId),
  ]);

  const pendingStatuses = new Set<ServiceOrderStatus>([
    ServiceOrderStatus.DRAFT,
    ServiceOrderStatus.CONFIRMED,
    ServiceOrderStatus.IN_PROGRESS,
    ServiceOrderStatus.COMPLETED,
  ]);

  const overall = {
    totalOrders: orders.length,
    assignedOrders: orders.filter((order) => order.assignedTo?.id).length,
    unassignedOrders: orders.filter((order) => !order.assignedTo?.id).length,
    paidAmount: orders
      .filter((order) => order.status === ServiceOrderStatus.PAID)
      .reduce((sum, order) => sum + order.total, 0),
    pendingAmount: orders
      .filter((order) => pendingStatuses.has(order.status))
      .reduce((sum, order) => sum + order.total, 0),
  };

  const grouped = [
    ...assignableUsers.map((user) => {
      const userOrders = orders.filter((order) => order.assignedTo?.id === user.id);

      return {
        key: user.id,
        responsibleId: user.id,
        responsibleName: user.name || user.email,
        responsibleEmail: user.email,
        isUnassigned: false,
        totalOrders: userOrders.length,
        pendingCount: userOrders.filter((order) => pendingStatuses.has(order.status)).length,
        inProgressCount: userOrders.filter((order) => order.status === ServiceOrderStatus.IN_PROGRESS).length,
        scheduledCount: userOrders.filter((order) => Boolean(order.scheduledFor)).length,
        paidAmount: userOrders
          .filter((order) => order.status === ServiceOrderStatus.PAID)
          .reduce((sum, order) => sum + order.total, 0),
        pendingAmount: userOrders
          .filter((order) => pendingStatuses.has(order.status))
          .reduce((sum, order) => sum + order.total, 0),
        orders: userOrders.slice(0, 5),
      };
    }),
    {
      key: "unassigned",
      responsibleId: null,
      responsibleName: "Sin asignar",
      responsibleEmail: null,
      isUnassigned: true,
      totalOrders: orders.filter((order) => !order.assignedTo?.id).length,
      pendingCount: orders.filter(
        (order) => !order.assignedTo?.id && pendingStatuses.has(order.status)
      ).length,
      inProgressCount: orders.filter(
        (order) => !order.assignedTo?.id && order.status === ServiceOrderStatus.IN_PROGRESS
      ).length,
      scheduledCount: orders.filter((order) => !order.assignedTo?.id && Boolean(order.scheduledFor)).length,
      paidAmount: orders
        .filter((order) => !order.assignedTo?.id && order.status === ServiceOrderStatus.PAID)
        .reduce((sum, order) => sum + order.total, 0),
      pendingAmount: orders
        .filter((order) => !order.assignedTo?.id && pendingStatuses.has(order.status))
        .reduce((sum, order) => sum + order.total, 0),
      orders: orders.filter((order) => !order.assignedTo?.id).slice(0, 5),
    },
  ]
    .filter((group) => group.totalOrders > 0)
    .sort((a, b) => {
      if (a.isUnassigned) {
        return 1;
      }

      if (b.isUnassigned) {
        return -1;
      }

      return b.totalOrders - a.totalOrders;
    });

  return {
    overall,
    groups: grouped,
  };
}
