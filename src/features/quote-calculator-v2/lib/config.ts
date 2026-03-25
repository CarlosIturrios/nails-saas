import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/src/lib/db";
import {
  OrganizationQuoteConfigInput,
  OrganizationQuoteConfigView,
  QuoteTemplateKey,
} from "@/src/features/quote-calculator-v2/lib/types";
import {
  buildQuoteConfigInputFromPreset,
  QuoteConfigPresetKey,
} from "@/src/features/quote-calculator-v2/lib/presets";

function asRecord(value: Prisma.JsonValue | null | undefined) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, string>;
}

function normalizeOptionalNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function sanitizeColor(value: string, fallback: string) {
  const normalized = value.trim();
  return normalized || fallback;
}

function sanitizeQuoteTemplate(value: string | null | undefined): QuoteTemplateKey {
  if (
    value === "beauty_soft" ||
    value === "barber_classic" ||
    value === "wellness_calm" ||
    value === "clinical_clean" ||
    value === "workshop_pro" ||
    value === "carwash_fresh" ||
    value === "craft_warm" ||
    value === "electrician_bold" ||
    value === "legacy_gica"
  ) {
    return value;
  }

  return "modern";
}

function toInputJson(
  value: Record<string, unknown> | null | undefined
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return value ? (value as Prisma.InputJsonValue) : Prisma.JsonNull;
}

export async function listOrganizationsForQuoteConfig() {
  return prisma.organization.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function ensureOrganizationQuoteConfig(organizationId: string) {
  const existing = await prisma.organizationConfig.findUnique({
    where: {
      organizationId,
    },
    include: {
      serviceCategories: {
        orderBy: {
          sortOrder: "asc",
        },
        include: {
          options: {
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
      },
      extraOptions: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      businessRules: true,
      uiConfig: true,
    },
  });

  if (existing) {
    return existing;
  }

  const organization = await prisma.organization.findUnique({
    where: {
      id: organizationId,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!organization) {
    throw new Error("La organización no existe");
  }

  const seed = buildQuoteConfigInputFromPreset("none", organization.id, organization.name);
  await saveOrganizationQuoteConfig(seed);

  return prisma.organizationConfig.findUniqueOrThrow({
    where: {
      organizationId,
    },
    include: {
      serviceCategories: {
        orderBy: {
          sortOrder: "asc",
        },
        include: {
          options: {
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
      },
      extraOptions: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      businessRules: true,
      uiConfig: true,
    },
  });
}

export async function initializeOrganizationQuoteConfigFromPreset(
  organizationId: string,
  organizationName: string,
  preset: QuoteConfigPresetKey
) {
  const existing = await prisma.organizationConfig.findUnique({
    where: {
      organizationId,
    },
    select: {
      id: true,
    },
  });

  if (existing) {
    return existing;
  }

  const input = buildQuoteConfigInputFromPreset(preset, organizationId, organizationName);
  return saveOrganizationQuoteConfig(input);
}

export async function getOrganizationQuoteConfigView(
  organizationId: string
): Promise<OrganizationQuoteConfigView> {
  const config = await ensureOrganizationQuoteConfig(organizationId);

  return {
    organizationId,
    branding: {
      businessName: config.businessName,
      businessType: config.businessType,
      logoUrl: config.logoUrl ?? "",
      quoteTemplate: sanitizeQuoteTemplate(config.quoteTemplate),
      primaryColor: config.primaryColor,
      secondaryColor: config.secondaryColor,
      currency: config.currency,
      language: config.language,
    },
    categories: config.serviceCategories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description ?? "",
      multiSelect: category.multiSelect,
      sortOrder: category.sortOrder,
      metadata:
        category.metadata && typeof category.metadata === "object" && !Array.isArray(category.metadata)
          ? (category.metadata as Record<string, unknown>)
          : null,
      options: category.options.map((option) => ({
        id: option.id,
        name: option.name,
        description: option.description ?? "",
        price: option.price,
        sortOrder: option.sortOrder,
        metadata:
          option.metadata && typeof option.metadata === "object" && !Array.isArray(option.metadata)
            ? (option.metadata as Record<string, unknown>)
            : null,
      })),
    })),
    extras: config.extraOptions.map((extra) => ({
      id: extra.id,
      name: extra.name,
      description: extra.description ?? "",
      price: extra.price,
      pricingType: extra.pricingType,
      includedQuantity: extra.includedQuantity,
      sortOrder: extra.sortOrder,
      metadata:
        extra.metadata && typeof extra.metadata === "object" && !Array.isArray(extra.metadata)
          ? (extra.metadata as Record<string, unknown>)
          : null,
    })),
    rules: {
      maxSelectedCategories: normalizeOptionalNumber(
        config.businessRules?.maxSelectedCategories
      ),
      maxQuantityPerExtra: normalizeOptionalNumber(
        config.businessRules?.maxQuantityPerExtra
      ),
      maxTotalSelections: normalizeOptionalNumber(
        config.businessRules?.maxTotalSelections
      ),
      extraPricingRules:
        config.businessRules?.extraPricingRules &&
        typeof config.businessRules.extraPricingRules === "object" &&
        !Array.isArray(config.businessRules.extraPricingRules)
          ? (config.businessRules.extraPricingRules as Record<string, unknown>)
          : null,
    },
    ui: {
      titles: asRecord(config.uiConfig?.titles),
      texts: asRecord(config.uiConfig?.texts),
      labels: asRecord(config.uiConfig?.labels),
    },
  };
}

export async function saveOrganizationQuoteConfig(
  input: OrganizationQuoteConfigInput
) {
  const organization = await prisma.organization.findUnique({
    where: {
      id: input.organizationId,
    },
    select: {
      id: true,
    },
  });

  if (!organization) {
    throw new Error("La organización no existe");
  }

  const categoryData = input.categories.map((category) => ({
    name: category.name.trim(),
    description: category.description?.trim() || null,
    multiSelect: category.multiSelect,
    sortOrder: category.sortOrder,
    metadata: toInputJson(category.metadata),
    options: {
      create: category.options.map((option) => ({
        name: option.name.trim(),
        description: option.description?.trim() || null,
        price: Math.max(0, Math.round(option.price)),
        sortOrder: option.sortOrder,
        metadata: toInputJson(option.metadata),
      })),
    },
  }));

  const extraData = input.extras.map((extra) => ({
    name: extra.name.trim(),
    description: extra.description?.trim() || null,
    price: Math.max(0, Math.round(extra.price)),
    pricingType: extra.pricingType,
    includedQuantity: Math.max(0, Math.round(extra.includedQuantity)),
    sortOrder: extra.sortOrder,
    metadata: toInputJson(extra.metadata),
  }));

  return prisma.$transaction(async (tx) => {
    const organizationConfig = await tx.organizationConfig.upsert({
      where: {
        organizationId: input.organizationId,
      },
      create: {
        organizationId: input.organizationId,
        businessName: input.branding.businessName.trim(),
        businessType: input.branding.businessType.trim() || "general",
        logoUrl: input.branding.logoUrl.trim() || null,
        quoteTemplate: sanitizeQuoteTemplate(input.branding.quoteTemplate),
        primaryColor: sanitizeColor(input.branding.primaryColor, "#1f2937"),
        secondaryColor: sanitizeColor(input.branding.secondaryColor, "#fffaf4"),
        currency: input.branding.currency.trim() || "MXN",
        language: input.branding.language.trim() || "es-MX",
      },
      update: {
        businessName: input.branding.businessName.trim(),
        businessType: input.branding.businessType.trim() || "general",
        logoUrl: input.branding.logoUrl.trim() || null,
        quoteTemplate: sanitizeQuoteTemplate(input.branding.quoteTemplate),
        primaryColor: sanitizeColor(input.branding.primaryColor, "#1f2937"),
        secondaryColor: sanitizeColor(input.branding.secondaryColor, "#fffaf4"),
        currency: input.branding.currency.trim() || "MXN",
        language: input.branding.language.trim() || "es-MX",
      },
      select: {
        id: true,
      },
    });

    await Promise.all([
      tx.serviceOption.deleteMany({
        where: {
          category: {
            organizationConfigId: organizationConfig.id,
          },
        },
      }),
      tx.serviceCategory.deleteMany({
        where: {
          organizationConfigId: organizationConfig.id,
        },
      }),
      tx.extraOption.deleteMany({
        where: {
          organizationConfigId: organizationConfig.id,
        },
      }),
    ]);

    await Promise.all([
      ...(categoryData.length > 0
        ? [
            tx.serviceCategory.createManyAndReturn({
              data: categoryData.map((category) => ({
                organizationConfigId: organizationConfig.id,
                name: category.name,
                description: category.description,
                multiSelect: category.multiSelect,
                sortOrder: category.sortOrder,
                metadata: category.metadata,
              })),
              select: {
                id: true,
              },
            }),
          ]
        : []),
      tx.businessRules.upsert({
        where: {
          organizationConfigId: organizationConfig.id,
        },
        create: {
          organizationConfigId: organizationConfig.id,
          maxSelectedCategories: input.rules.maxSelectedCategories,
          maxQuantityPerExtra: input.rules.maxQuantityPerExtra,
          maxTotalSelections: input.rules.maxTotalSelections,
          extraPricingRules: toInputJson(input.rules.extraPricingRules ?? null),
        },
        update: {
          maxSelectedCategories: input.rules.maxSelectedCategories,
          maxQuantityPerExtra: input.rules.maxQuantityPerExtra,
          maxTotalSelections: input.rules.maxTotalSelections,
          extraPricingRules: toInputJson(input.rules.extraPricingRules ?? null),
        },
      }),
      tx.uIConfig.upsert({
        where: {
          organizationConfigId: organizationConfig.id,
        },
        create: {
          organizationConfigId: organizationConfig.id,
          titles: input.ui.titles,
          texts: input.ui.texts,
          labels: input.ui.labels,
        },
        update: {
          titles: input.ui.titles,
          texts: input.ui.texts,
          labels: input.ui.labels,
        },
      }),
      ...(extraData.length > 0
        ? [
            tx.extraOption.createMany({
              data: extraData.map((extra) => ({
                organizationConfigId: organizationConfig.id,
                ...extra,
              })),
            }),
          ]
        : []),
    ]);

    const insertedCategories = await tx.serviceCategory.findMany({
      where: {
        organizationConfigId: organizationConfig.id,
      },
      select: {
        id: true,
      },
      orderBy: {
        sortOrder: "asc",
      },
    });

    const optionsData = categoryData.flatMap((category, categoryIndex) =>
      category.options.create.map((option) => ({
        categoryId: insertedCategories[categoryIndex]?.id,
        ...option,
      }))
    );

    if (optionsData.some((option) => !option.categoryId)) {
      throw new Error("No se pudieron guardar las opciones de servicio");
    }

    if (optionsData.length > 0) {
      await tx.serviceOption.createMany({
        data: optionsData as Array<{
          categoryId: string;
          name: string;
          description: string | null;
          price: number;
          sortOrder: number;
          metadata: Prisma.InputJsonValue | typeof Prisma.JsonNull;
        }>,
      });
    }

    return organizationConfig;
  });
}
