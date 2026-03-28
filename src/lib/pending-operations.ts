import "server-only";

import {
  QuoteStatus,
  ServiceOrderStatus,
} from "@prisma/client";

import { prisma } from "@/src/lib/db";

function getDayRange(baseDate: Date) {
  const start = new Date(baseDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(baseDate);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export async function getPendingOperationsSnapshot(
  organizationId: string,
  options: {
    date?: Date;
    limit?: number;
  } = {}
) {
  const baseDate = options.date ?? new Date();
  const { start, end } = getDayRange(baseDate);
  const take = options.limit ?? 100;

  const [acceptedQuotes, activeOrders] = await Promise.all([
    prisma.quote.findMany({
      where: {
        organizationId,
        status: QuoteStatus.ACCEPTED,
        convertedAt: null,
        OR: [
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
        ],
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        serviceOrders: {
          select: {
            id: true,
          },
          take: 1,
        },
        items: {
          orderBy: {
            sortOrder: "asc",
          },
          take: 4,
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
      take,
    }),
    prisma.serviceOrder.findMany({
      where: {
        organizationId,
        status: {
          in: [
            ServiceOrderStatus.DRAFT,
            ServiceOrderStatus.CONFIRMED,
            ServiceOrderStatus.IN_PROGRESS,
            ServiceOrderStatus.COMPLETED,
          ],
        },
        OR: [
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
        ],
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        items: {
          orderBy: {
            sortOrder: "asc",
          },
          take: 4,
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
      take,
    }),
  ]);

  return {
    summary: {
      acceptedQuoteCount: acceptedQuotes.length,
      activeOrderCount: activeOrders.length,
      quoteAmount: acceptedQuotes.reduce((sum, quote) => sum + quote.total, 0),
      orderAmount: activeOrders.reduce((sum, order) => sum + order.total, 0),
    },
    acceptedQuotes,
    activeOrders,
  };
}
