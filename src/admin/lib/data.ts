import "server-only";

import {
  Prisma,
  UserOrganizationPermissionProfile,
  UserOrganizationRole,
  UserRole,
} from "@prisma/client";

import {
  AdminFieldConfig,
  AdminFieldOption,
  AdminModelConfig,
  getEditableFields,
} from "@/src/admin/config/models";
import { prisma } from "@/src/lib/db";
import { initializeOrganizationQuoteConfigFromPreset } from "@/src/features/quote-calculator-v2/lib/config";
import { normalizeQuoteConfigPreset } from "@/src/features/quote-calculator-v2/lib/presets";
import { buildScopedMembershipWhere } from "@/src/lib/organizations/context";

interface ListAdminRecordsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  currentOrganizationId?: string | null;
}

export type AdminFormOptions = Record<string, AdminFieldOption[]>;
export type AdminListItem = Record<string, unknown> & { id: string };
export interface AdminListResult {
  items: AdminListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const INSENSITIVE_MODE = Prisma.QueryMode.insensitive;

function getModelDelegate(model: string) {
  const delegate = (prisma as unknown as Record<string, unknown>)[model];

  if (!delegate) {
    throw new Error(`Modelo Prisma no disponible: ${model}`);
  }

  return delegate as {
    count: (args?: Record<string, unknown>) => Promise<number>;
    findFirst: (args?: Record<string, unknown>) => Promise<Record<string, unknown> | null>;
    findMany: (args?: Record<string, unknown>) => Promise<Record<string, unknown>[]>;
    create: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
    update: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
    delete: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
  };
}

function dedupeStringArray(values: unknown) {
  const entries = Array.isArray(values)
    ? values
    : typeof values === "string" && values
      ? [values]
      : [];

  return Array.from(
    new Set(
      entries
        .map((value) => String(value).trim())
        .filter(Boolean)
    )
  );
}

function getUserDisplayName(user: {
  firstName: string;
  lastName: string;
  email: string;
}) {
  const fullName = `${user.firstName} ${user.lastName}`.trim();
  return fullName ? `${fullName} · ${user.email}` : user.email;
}

function getClientDisplayName(client: {
  name: string;
  phone: string;
  email?: string | null;
}) {
  return [client.name, client.phone, client.email].filter(Boolean).join(" · ");
}

function getQuoteDisplayLabel(quote: {
  id: string;
  customerName?: string | null;
  status?: string;
  client?: { name: string } | null;
}) {
  const customer = quote.customerName?.trim() || quote.client?.name || "Sin cliente";
  return `#${quote.id.slice(0, 8)} · ${customer}${quote.status ? ` · ${quote.status}` : ""}`;
}

function getServiceOrderDisplayLabel(order: {
  id: string;
  customerName?: string | null;
  status?: string;
  client?: { name: string } | null;
}) {
  const customer = order.customerName?.trim() || order.client?.name || "Sin cliente";
  return `#${order.id.slice(0, 8)} · ${customer}${order.status ? ` · ${order.status}` : ""}`;
}

function joinLabels(labels: string[]) {
  if (labels.length === 0) {
    return "-";
  }

  if (labels.length <= 3) {
    return labels.join(", ");
  }

  return `${labels.slice(0, 3).join(", ")} +${labels.length - 3}`;
}

function normalizeFieldValue(field: AdminFieldConfig, value: unknown) {
  if (field.type === "multiselect") {
    return dedupeStringArray(value);
  }

  if (value === "" || value === null || value === undefined) {
    if (field.type === "boolean") {
      return false;
    }

    return null;
  }

  if (field.type === "number") {
    const parsed = Number(value);

    if (Number.isNaN(parsed)) {
      throw new Error(`El campo ${field.label} debe ser numérico`);
    }

    return parsed;
  }

  if (field.type === "boolean") {
    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "string") {
      return value === "true";
    }
  }

  if (field.type === "date") {
    return new Date(String(value));
  }

  return String(value);
}

function buildWhereClause(
  config: AdminModelConfig,
  search: string,
  currentOrganizationId?: string | null
) {
  const andClauses: Record<string, unknown>[] = [];

  if (currentOrganizationId && config.scopedByOrganization && config.scopeField) {
    andClauses.push({ [config.scopeField]: currentOrganizationId });
  }

  if (search && config.searchFields?.length) {
    andClauses.push({
      OR: config.searchFields.map((fieldName) => ({
        [fieldName]: {
          contains: search,
          mode: INSENSITIVE_MODE,
        },
      })),
    });
  }

  if (andClauses.length === 0) {
    return {};
  }

  if (andClauses.length === 1) {
    return andClauses[0];
  }

  return { AND: andClauses };
}

function buildSelectClause(config: AdminModelConfig) {
  const select: Record<string, boolean> = { id: true };

  for (const field of config.fields) {
    if (field.persisted === false) {
      continue;
    }

    select[field.name] = true;
  }

  return select;
}

export function sanitizePayload(
  config: AdminModelConfig,
  payload: Record<string, unknown>,
  options: {
    includeNonPersisted?: boolean;
  } = {}
) {
  const includeNonPersisted = options.includeNonPersisted ?? true;
  const data: Record<string, unknown> = {};

  for (const field of getEditableFields(config)) {
    if (!includeNonPersisted && field.persisted === false) {
      continue;
    }

    const normalizedValue = normalizeFieldValue(field, payload[field.name]);

    if (
      field.required &&
      (normalizedValue === null ||
        normalizedValue === "" ||
        (Array.isArray(normalizedValue) && normalizedValue.length === 0))
    ) {
      throw new Error(`El campo ${field.label} es obligatorio`);
    }

    data[field.name] = normalizedValue;
  }

  return data;
}

async function ensureScopedRecordAccess(
  config: AdminModelConfig,
  delegate: ReturnType<typeof getModelDelegate>,
  id: string,
  currentOrganizationId?: string | null
) {
  if (!currentOrganizationId || !config.scopedByOrganization || !config.scopeField) {
    return;
  }

  const record = await delegate.findFirst({
    where: {
      id,
      [config.scopeField]: currentOrganizationId,
    },
    select: { id: true },
  });

  if (!record) {
    throw new Error("Registro no encontrado o fuera de tu organización");
  }
}

async function getUserOptions() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      active: true,
    },
    orderBy: [
      { firstName: "asc" },
      { lastName: "asc" },
      { email: "asc" },
    ],
  });

  return users.map((user) => ({
    value: user.id,
    label: getUserDisplayName(user),
    description: user.active ? "Activo" : "Inactivo",
  }));
}

async function getOrganizationOptions() {
  const organizations = await prisma.organization.findMany({
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          memberships: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return organizations.map((organization) => ({
    value: organization.id,
    label: organization.name,
    description: `${organization._count.memberships} usuarios ligados`,
  }));
}

async function getClientOptions() {
  const clients = await prisma.client.findMany({
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      organization: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [{ name: "asc" }, { createdAt: "desc" }],
    take: 200,
  });

  return clients.map((client) => ({
    value: client.id,
    label: getClientDisplayName(client),
    description: client.organization?.name ?? "Sin organización",
  }));
}

async function getQuoteOptions() {
  const quotes = await prisma.quote.findMany({
    select: {
      id: true,
      customerName: true,
      status: true,
      total: true,
      currency: true,
      client: {
        select: {
          name: true,
        },
      },
      organization: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return quotes.map((quote) => ({
    value: quote.id,
    label: getQuoteDisplayLabel(quote),
    description: `${quote.organization.name} · ${quote.currency} ${quote.total}`,
  }));
}

async function getServiceOrderOptions() {
  const serviceOrders = await prisma.serviceOrder.findMany({
    select: {
      id: true,
      customerName: true,
      status: true,
      total: true,
      currency: true,
      client: {
        select: {
          name: true,
        },
      },
      organization: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return serviceOrders.map((order) => ({
    value: order.id,
    label: getServiceOrderDisplayLabel(order),
    description: `${order.organization.name} · ${order.currency} ${order.total}`,
  }));
}

export async function getAdminFormOptions(config: AdminModelConfig): Promise<AdminFormOptions> {
  const formOptions: AdminFormOptions = {};

  for (const field of getEditableFields(config)) {
    if (field.type === "select" && field.options) {
      formOptions[field.name] = field.options.map((option) => ({
        value: option,
        label: option,
      }));
      continue;
    }

    if (!field.relation) {
      continue;
    }

    if (field.relation.resource === "users") {
      formOptions[field.name] = await getUserOptions();
      continue;
    }

    if (field.relation.resource === "organizations") {
      formOptions[field.name] = await getOrganizationOptions();
      continue;
    }

    if (field.relation.resource === "clients") {
      formOptions[field.name] = await getClientOptions();
      continue;
    }

    if (field.relation.resource === "quotes") {
      formOptions[field.name] = await getQuoteOptions();
      continue;
    }

    if (field.relation.resource === "serviceOrders") {
      formOptions[field.name] = await getServiceOrderOptions();
    }
  }

  return formOptions;
}

async function syncUserMemberships(userId: string, organizationIds: string[]) {
  const selectedOrganizationIds = dedupeStringArray(organizationIds);
  const existingMemberships = await prisma.userOrganization.findMany({
    where: { userId },
    select: {
      id: true,
      organizationId: true,
      role: true,
    },
  });

  const existingOrganizationIds = new Set(
    existingMemberships.map((membership) => membership.organizationId)
  );
  const membershipsToDelete = existingMemberships
    .filter((membership) => !selectedOrganizationIds.includes(membership.organizationId))
    .map((membership) => membership.id);
  const organizationsToCreate = selectedOrganizationIds.filter(
    (organizationId) => !existingOrganizationIds.has(organizationId)
  );

  await prisma.$transaction([
    ...(membershipsToDelete.length > 0
      ? [
          prisma.userOrganization.deleteMany({
            where: {
              id: {
                in: membershipsToDelete,
              },
            },
          }),
        ]
      : []),
    ...(organizationsToCreate.length > 0
      ? [
          prisma.userOrganization.createMany({
            data: organizationsToCreate.map((organizationId) => ({
              userId,
              organizationId,
              role: UserOrganizationRole.EMPLOYEE,
              permissionProfile: UserOrganizationPermissionProfile.FULL_SERVICE,
            })),
          }),
        ]
      : []),
  ]);
}

async function syncOrganizationMembers(organizationId: string, userIds: string[]) {
  const selectedUserIds = dedupeStringArray(userIds);
  const existingMemberships = await prisma.userOrganization.findMany({
    where: { organizationId },
    select: {
      id: true,
      userId: true,
      role: true,
    },
  });

  const existingUserIds = new Set(existingMemberships.map((membership) => membership.userId));
  const membershipsToDelete = existingMemberships
    .filter((membership) => !selectedUserIds.includes(membership.userId))
    .map((membership) => membership.id);
  const usersToCreate = selectedUserIds.filter((userId) => !existingUserIds.has(userId));

  await prisma.$transaction([
    ...(membershipsToDelete.length > 0
      ? [
          prisma.userOrganization.deleteMany({
            where: {
              id: {
                in: membershipsToDelete,
              },
            },
          }),
        ]
      : []),
    ...(usersToCreate.length > 0
      ? [
          prisma.userOrganization.createMany({
            data: usersToCreate.map((userId) => ({
              userId,
              organizationId,
              role: UserOrganizationRole.EMPLOYEE,
              permissionProfile: UserOrganizationPermissionProfile.FULL_SERVICE,
            })),
          }),
        ]
      : []),
  ]);
}

export async function listAdminRecords(
  config: AdminModelConfig,
  params: ListAdminRecordsParams = {}
): Promise<AdminListResult> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, params.pageSize ?? config.pageSize ?? 10));
  const search = params.search?.trim() ?? "";
  const currentOrganizationId = params.currentOrganizationId ?? null;

  if (config.model === "user") {
    const where = search
      ? {
          OR: [
            {
              firstName: {
                contains: search,
                mode: INSENSITIVE_MODE,
              },
            },
            {
              lastName: {
                contains: search,
                mode: INSENSITIVE_MODE,
              },
            },
            {
              email: {
                contains: search,
                mode: INSENSITIVE_MODE,
              },
            },
            {
              phone: {
                contains: search,
                mode: INSENSITIVE_MODE,
              },
            },
            {
              memberships: {
                some: {
                  organization: {
                    name: {
                      contains: search,
                      mode: INSENSITIVE_MODE,
                    },
                  },
                },
              },
            },
          ],
        }
      : currentOrganizationId && config.scopedByOrganization
        ? buildScopedMembershipWhere(currentOrganizationId)
        : {};

    const [total, items] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          countryCode: true,
          active: true,
          role: true,
          createdAt: true,
          memberships: {
            select: {
              organizationId: true,
              role: true,
              organization: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        organizationIds: item.memberships.map((membership) => membership.organizationId),
        organizationNames: joinLabels(
          item.memberships.map((membership) => membership.organization.name)
        ),
      })),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  if (config.model === "organization") {
    const where = search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: INSENSITIVE_MODE,
              },
            },
            {
              memberships: {
                some: {
                  user: {
                    OR: [
                      {
                        firstName: {
                          contains: search,
                          mode: INSENSITIVE_MODE,
                        },
                      },
                      {
                        lastName: {
                          contains: search,
                          mode: INSENSITIVE_MODE,
                        },
                      },
                      {
                        email: {
                          contains: search,
                          mode: INSENSITIVE_MODE,
                        },
                      },
                    ],
                  },
                },
              },
            },
          ],
        }
      : {};

    const [total, items] = await Promise.all([
      prisma.organization.count({ where }),
      prisma.organization.findMany({
        where,
        select: {
          id: true,
          name: true,
          createdAt: true,
          memberships: {
            select: {
              userId: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        memberUserIds: item.memberships.map((membership) => membership.userId),
        memberNames: joinLabels(
          item.memberships.map((membership) => getUserDisplayName(membership.user))
        ),
      })),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  if (config.model === "userOrganization") {
    const normalizedRoleSearch =
      search.toUpperCase() === UserOrganizationRole.ORG_ADMIN
        ? UserOrganizationRole.ORG_ADMIN
        : search.toUpperCase() === UserOrganizationRole.EMPLOYEE
          ? UserOrganizationRole.EMPLOYEE
          : null;

    const where = search
      ? {
          OR: [
            ...(normalizedRoleSearch
              ? [
                  {
                    role: {
                      equals: normalizedRoleSearch,
                    },
                  },
                ]
              : []),
            {
              user: {
                OR: [
                  {
                    firstName: {
                      contains: search,
                      mode: INSENSITIVE_MODE,
                    },
                  },
                  {
                    lastName: {
                      contains: search,
                      mode: INSENSITIVE_MODE,
                    },
                  },
                  {
                    email: {
                      contains: search,
                      mode: INSENSITIVE_MODE,
                    },
                  },
                ],
              },
            },
            {
              organization: {
                name: {
                  contains: search,
                  mode: INSENSITIVE_MODE,
                },
              },
            },
          ],
        }
      : {};

    const [total, items] = await Promise.all([
      prisma.userOrganization.count({ where }),
      prisma.userOrganization.findMany({
        where,
        select: {
          id: true,
          userId: true,
          organizationId: true,
          role: true,
          createdAt: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          organization: {
            select: {
              name: true,
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        userName: getUserDisplayName(item.user),
        organizationName: item.organization.name,
      })),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  if (config.model === "client") {
    const where = search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: INSENSITIVE_MODE,
              },
            },
            {
              phone: {
                contains: search,
                mode: INSENSITIVE_MODE,
              },
            },
            {
              email: {
                contains: search,
                mode: INSENSITIVE_MODE,
              },
            },
            {
              organization: {
                name: {
                  contains: search,
                  mode: INSENSITIVE_MODE,
                },
              },
            },
          ],
        }
      : {};

    const [total, items] = await Promise.all([
      prisma.client.count({ where }),
      prisma.client.findMany({
        where,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          organizationId: true,
          createdAt: true,
          organization: {
            select: {
              name: true,
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        organizationName: item.organization?.name ?? "-",
      })),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  if (config.model === "quote") {
    const where = search
      ? {
          OR: [
            { customerName: { contains: search, mode: INSENSITIVE_MODE } },
            { customerPhone: { contains: search, mode: INSENSITIVE_MODE } },
            { notes: { contains: search, mode: INSENSITIVE_MODE } },
            { status: { equals: search.toUpperCase() as never } },
            {
              organization: {
                name: { contains: search, mode: INSENSITIVE_MODE },
              },
            },
            {
              client: {
                name: { contains: search, mode: INSENSITIVE_MODE },
              },
            },
            {
              createdBy: {
                OR: [
                  { firstName: { contains: search, mode: INSENSITIVE_MODE } },
                  { lastName: { contains: search, mode: INSENSITIVE_MODE } },
                  { email: { contains: search, mode: INSENSITIVE_MODE } },
                ],
              },
            },
          ],
        }
      : {};

    const [total, items] = await Promise.all([
      prisma.quote.count({ where }),
      prisma.quote.findMany({
        where,
        select: {
          id: true,
          organizationId: true,
          clientId: true,
          createdByUserId: true,
          status: true,
          flowType: true,
          customerName: true,
          customerPhone: true,
          notes: true,
          scheduledFor: true,
          acceptedAt: true,
          convertedAt: true,
          subtotal: true,
          total: true,
          currency: true,
          source: true,
          createdAt: true,
          organization: { select: { name: true } },
          client: { select: { name: true } },
          createdBy: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        organizationName: item.organization.name,
        clientName: item.client?.name ?? "-",
        createdByName: item.createdBy ? getUserDisplayName(item.createdBy) : "-",
      })),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  if (config.model === "serviceOrder") {
    const where = search
      ? {
          OR: [
            { customerName: { contains: search, mode: INSENSITIVE_MODE } },
            { customerPhone: { contains: search, mode: INSENSITIVE_MODE } },
            { notes: { contains: search, mode: INSENSITIVE_MODE } },
            { status: { equals: search.toUpperCase() as never } },
            {
              organization: {
                name: { contains: search, mode: INSENSITIVE_MODE },
              },
            },
            {
              client: {
                name: { contains: search, mode: INSENSITIVE_MODE },
              },
            },
            {
              createdBy: {
                OR: [
                  { firstName: { contains: search, mode: INSENSITIVE_MODE } },
                  { lastName: { contains: search, mode: INSENSITIVE_MODE } },
                  { email: { contains: search, mode: INSENSITIVE_MODE } },
                ],
              },
            },
            {
              assignedTo: {
                OR: [
                  { firstName: { contains: search, mode: INSENSITIVE_MODE } },
                  { lastName: { contains: search, mode: INSENSITIVE_MODE } },
                  { email: { contains: search, mode: INSENSITIVE_MODE } },
                ],
              },
            },
          ],
        }
      : {};

    const [total, items] = await Promise.all([
      prisma.serviceOrder.count({ where }),
      prisma.serviceOrder.findMany({
        where,
        select: {
          id: true,
          organizationId: true,
          clientId: true,
          sourceQuoteId: true,
          createdByUserId: true,
          assignedToUserId: true,
          status: true,
          flowType: true,
          customerName: true,
          customerPhone: true,
          notes: true,
          scheduledFor: true,
          startedAt: true,
          completedAt: true,
          paidAt: true,
          subtotal: true,
          total: true,
          currency: true,
          source: true,
          createdAt: true,
          organization: { select: { name: true } },
          client: { select: { name: true } },
          sourceQuote: {
            select: { id: true, customerName: true, status: true, client: { select: { name: true } } },
          },
          createdBy: {
            select: { firstName: true, lastName: true, email: true },
          },
          assignedTo: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        organizationName: item.organization.name,
        clientName: item.client?.name ?? "-",
        sourceQuoteLabel: item.sourceQuote ? getQuoteDisplayLabel(item.sourceQuote) : "-",
        createdByName: item.createdBy ? getUserDisplayName(item.createdBy) : "-",
        assignedToName: item.assignedTo ? getUserDisplayName(item.assignedTo) : "-",
      })),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  if (config.model === "quoteItem") {
    const where = search
      ? {
          OR: [
            { label: { contains: search, mode: INSENSITIVE_MODE } },
            { description: { contains: search, mode: INSENSITIVE_MODE } },
            {
              quote: {
                customerName: { contains: search, mode: INSENSITIVE_MODE },
              },
            },
            {
              quote: {
                client: {
                  name: { contains: search, mode: INSENSITIVE_MODE },
                },
              },
            },
          ],
        }
      : {};

    const [total, items] = await Promise.all([
      prisma.quoteItem.count({ where }),
      prisma.quoteItem.findMany({
        where,
        select: {
          id: true,
          quoteId: true,
          itemType: true,
          label: true,
          description: true,
          quantity: true,
          unitPrice: true,
          total: true,
          sortOrder: true,
          createdAt: true,
          quote: {
            select: {
              id: true,
              customerName: true,
              status: true,
              client: { select: { name: true } },
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        quoteLabel: getQuoteDisplayLabel(item.quote),
      })),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  if (config.model === "serviceOrderItem") {
    const where = search
      ? {
          OR: [
            { label: { contains: search, mode: INSENSITIVE_MODE } },
            { description: { contains: search, mode: INSENSITIVE_MODE } },
            {
              serviceOrder: {
                customerName: { contains: search, mode: INSENSITIVE_MODE },
              },
            },
            {
              serviceOrder: {
                client: {
                  name: { contains: search, mode: INSENSITIVE_MODE },
                },
              },
            },
          ],
        }
      : {};

    const [total, items] = await Promise.all([
      prisma.serviceOrderItem.count({ where }),
      prisma.serviceOrderItem.findMany({
        where,
        select: {
          id: true,
          serviceOrderId: true,
          itemType: true,
          label: true,
          description: true,
          quantity: true,
          unitPrice: true,
          total: true,
          sortOrder: true,
          createdAt: true,
          serviceOrder: {
            select: {
              id: true,
              customerName: true,
              status: true,
              client: { select: { name: true } },
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        serviceOrderLabel: getServiceOrderDisplayLabel(item.serviceOrder),
      })),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  if (config.model === "loginCode") {
    const where = search
      ? {
          OR: [
            {
              email: {
                contains: search,
                mode: INSENSITIVE_MODE,
              },
            },
            {
              code: {
                contains: search,
                mode: INSENSITIVE_MODE,
              },
            },
            {
              user: {
                OR: [
                  {
                    firstName: {
                      contains: search,
                      mode: INSENSITIVE_MODE,
                    },
                  },
                  {
                    lastName: {
                      contains: search,
                      mode: INSENSITIVE_MODE,
                    },
                  },
                  {
                    email: {
                      contains: search,
                      mode: INSENSITIVE_MODE,
                    },
                  },
                ],
              },
            },
          ],
        }
      : {};

    const [total, items] = await Promise.all([
      prisma.loginCode.count({ where }),
      prisma.loginCode.findMany({
        where,
        select: {
          id: true,
          email: true,
          code: true,
          expiresAt: true,
          createdAt: true,
          userId: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        userName: item.user ? getUserDisplayName(item.user) : "-",
      })),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  const delegate = getModelDelegate(config.model);
  const where = buildWhereClause(config, search, currentOrganizationId);
  const select = buildSelectClause(config);

  const [total, items] = await Promise.all([
    delegate.count({ where }),
    delegate.findMany({
      where,
      select,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    items: items as AdminListItem[],
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function createAdminRecord(
  config: AdminModelConfig,
  payload: Record<string, unknown>,
  currentOrganizationId?: string | null
) {
  if (config.model === "user") {
    const data = sanitizePayload(config, payload);
    const organizationIds = dedupeStringArray(data.organizationIds);

    const createdUser = await prisma.user.create({
      data: {
        firstName: String(data.firstName),
        lastName: String(data.lastName),
        email: String(data.email),
        phone: String(data.phone),
        countryCode: String(data.countryCode),
        active: Boolean(data.active ?? true),
        role:
          data.role === UserRole.SUPER_ADMIN
            ? UserRole.SUPER_ADMIN
            : data.role === UserRole.SAAS_ADMIN
              ? UserRole.SAAS_ADMIN
              : UserRole.STANDARD_USER,
      },
    });

    await syncUserMemberships(createdUser.id, organizationIds);
    return createdUser;
  }

  if (config.model === "organization") {
    const data = sanitizePayload(config, payload);
    const memberUserIds = dedupeStringArray(data.memberUserIds);
    const quoteConfigPreset = normalizeQuoteConfigPreset(data.quoteConfigPreset);

    const organization = await prisma.organization.create({
      data: {
        name: String(data.name),
      },
    });

    await syncOrganizationMembers(organization.id, memberUserIds);
    await initializeOrganizationQuoteConfigFromPreset(
      organization.id,
      organization.name,
      quoteConfigPreset
    );
    return organization;
  }

  if (config.model === "userOrganization") {
    const data = sanitizePayload(config, payload);

    return prisma.userOrganization.create({
      data: {
        userId: String(data.userId),
        organizationId: String(data.organizationId),
        role:
          data.role === UserOrganizationRole.ORG_ADMIN
            ? UserOrganizationRole.ORG_ADMIN
            : UserOrganizationRole.EMPLOYEE,
        permissionProfile:
          data.permissionProfile === UserOrganizationPermissionProfile.FRONT_DESK
            ? UserOrganizationPermissionProfile.FRONT_DESK
            : data.permissionProfile === UserOrganizationPermissionProfile.SALES_ONLY
              ? UserOrganizationPermissionProfile.SALES_ONLY
              : data.permissionProfile === UserOrganizationPermissionProfile.OPERATOR
                ? UserOrganizationPermissionProfile.OPERATOR
                : data.permissionProfile === UserOrganizationPermissionProfile.VIEW_ONLY
                  ? UserOrganizationPermissionProfile.VIEW_ONLY
                  : UserOrganizationPermissionProfile.FULL_SERVICE,
      },
    });
  }

  const delegate = getModelDelegate(config.model);
  const data = sanitizePayload(config, payload, { includeNonPersisted: false });

  if (currentOrganizationId && config.scopedByOrganization && config.scopeField !== "id") {
    data[config.scopeField ?? "organizationId"] = currentOrganizationId;
  }

  return delegate.create({ data });
}

export async function updateAdminRecord(
  config: AdminModelConfig,
  id: string,
  payload: Record<string, unknown>,
  currentOrganizationId?: string | null
) {
  if (config.model === "user") {
    const data = sanitizePayload(config, payload);
    const organizationIds = dedupeStringArray(data.organizationIds);

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        firstName: String(data.firstName),
        lastName: String(data.lastName),
        email: String(data.email),
        phone: String(data.phone),
        countryCode: String(data.countryCode),
        active: Boolean(data.active ?? true),
        role:
          data.role === UserRole.SUPER_ADMIN
            ? UserRole.SUPER_ADMIN
            : data.role === UserRole.SAAS_ADMIN
              ? UserRole.SAAS_ADMIN
              : UserRole.STANDARD_USER,
      },
    });

    await syncUserMemberships(id, organizationIds);
    return updatedUser;
  }

  if (config.model === "organization") {
    const data = sanitizePayload(config, payload);
    const memberUserIds = dedupeStringArray(data.memberUserIds);

    const organization = await prisma.organization.update({
      where: { id },
      data: {
        name: String(data.name),
      },
    });

    await syncOrganizationMembers(id, memberUserIds);
    return organization;
  }

  if (config.model === "userOrganization") {
    const data = sanitizePayload(config, payload);

    return prisma.userOrganization.update({
      where: { id },
      data: {
        userId: String(data.userId),
        organizationId: String(data.organizationId),
        role:
          data.role === UserOrganizationRole.ORG_ADMIN
            ? UserOrganizationRole.ORG_ADMIN
            : UserOrganizationRole.EMPLOYEE,
        permissionProfile:
          data.permissionProfile === UserOrganizationPermissionProfile.FRONT_DESK
            ? UserOrganizationPermissionProfile.FRONT_DESK
            : data.permissionProfile === UserOrganizationPermissionProfile.SALES_ONLY
              ? UserOrganizationPermissionProfile.SALES_ONLY
              : data.permissionProfile === UserOrganizationPermissionProfile.OPERATOR
                ? UserOrganizationPermissionProfile.OPERATOR
                : data.permissionProfile === UserOrganizationPermissionProfile.VIEW_ONLY
                  ? UserOrganizationPermissionProfile.VIEW_ONLY
                  : UserOrganizationPermissionProfile.FULL_SERVICE,
      },
    });
  }

  const delegate = getModelDelegate(config.model);
  const data = sanitizePayload(config, payload, { includeNonPersisted: false });
  await ensureScopedRecordAccess(config, delegate, id, currentOrganizationId);

  return delegate.update({
    where: { id },
    data,
  });
}

export async function deleteAdminRecord(
  config: AdminModelConfig,
  id: string,
  currentOrganizationId?: string | null
) {
  if (config.model === "userOrganization") {
    await prisma.userOrganization.delete({
      where: { id },
    });

    return { success: true };
  }

  if (config.model === "user") {
    await prisma.loginCode.updateMany({
      where: { userId: id },
      data: { userId: null },
    });

    await prisma.user.delete({
      where: { id },
    });

    return { success: true };
  }

  if (config.model === "organization") {
    await prisma.client.updateMany({
      where: { organizationId: id },
      data: { organizationId: null },
    });

    await prisma.organization.delete({
      where: { id },
    });

    return { success: true };
  }

  const delegate = getModelDelegate(config.model);
  await ensureScopedRecordAccess(config, delegate, id, currentOrganizationId);

  return delegate.delete({
    where: { id },
  });
}
