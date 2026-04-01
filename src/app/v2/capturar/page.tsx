import { QuoteItemType, ServiceOrderItemType } from "@prisma/client";
import { notFound, redirect } from "next/navigation";

import { QuoteCalculatorV2 } from "@/src/features/quote-calculator-v2/components/QuoteCalculatorV2";
import { getOrganizationQuoteConfigView } from "@/src/features/quote-calculator-v2/lib/config";
import { getIndustryPresentation } from "@/src/features/v2/presentation";
import { V2_ROUTES } from "@/src/features/v2/routing";
import {
  canManageOrganization,
  canUseManualAdjustments,
  getOperationalFrontendAccess,
} from "@/src/lib/authorization";
import { requireCurrentOrganization } from "@/src/lib/organizations/context";
import { getQuoteById } from "@/src/lib/quotes";
import {
  getServiceOrderById,
  listAssignableUsersForOrganization,
} from "@/src/lib/service-orders";

interface V2CapturePageProps {
  searchParams: Promise<{
    clientId?: string;
    customerName?: string;
    customerPhone?: string;
    intent?: string;
    editQuoteId?: string;
    editOrderId?: string;
  }>;
}

export default async function V2CapturePage({
  searchParams,
}: V2CapturePageProps) {
  const context = await requireCurrentOrganization();
  const timeZone =
    context.currentTimezone?.timezone ?? context.currentOrganization.defaultTimezone;
  const query = await searchParams;
  const access = getOperationalFrontendAccess(
    context.user.role,
    context.currentOrganizationRole,
    context.currentOrganizationPermissionProfile
  );
  const canEditExistingRecords = canManageOrganization(
    context.user.role,
    context.currentOrganizationRole
  );

  if (!access.canUseNewSale) {
    redirect(V2_ROUTES.pending);
  }

  const editQuoteId = query.editQuoteId?.trim() || null;
  const editOrderId = query.editOrderId?.trim() || null;

  if ((editQuoteId || editOrderId) && !canEditExistingRecords) {
    redirect(V2_ROUTES.capture);
  }

  const [config, assignableUsers, editTarget] = await Promise.all([
    getOrganizationQuoteConfigView(context.currentOrganizationId),
    listAssignableUsersForOrganization(context.currentOrganizationId),
    editOrderId
      ? getServiceOrderById(context.currentOrganizationId, editOrderId)
          .then((order) => ({ type: "order" as const, order }))
          .catch(() => null)
      : editQuoteId
        ? getQuoteById(context.currentOrganizationId, editQuoteId)
            .then((quote) => ({ type: "quote" as const, quote }))
            .catch(() => null)
        : Promise.resolve(null),
  ]);
  const presentation = getIndustryPresentation({
    businessType: config.branding.businessType,
  });
  const initialIntent =
    query.intent === "quote" || query.intent === "order" || query.intent === "paid"
      ? query.intent
      : undefined;

  if ((editQuoteId || editOrderId) && !editTarget) {
    notFound();
  }

  const initialEditContext =
    editTarget?.type === "quote"
      ? {
          mode: "quote" as const,
          entityId: editTarget.quote.id,
          clientId: editTarget.quote.client?.id ?? null,
          customerName: editTarget.quote.customerName ?? editTarget.quote.client?.name ?? "",
          customerPhone:
            editTarget.quote.customerPhone ??
            (editTarget.quote.client?.phone &&
            editTarget.quote.client.phone !== "SIN_TELEFONO"
              ? editTarget.quote.client.phone
              : "") ??
            "",
          notes: editTarget.quote.notes ?? "",
          flowType: editTarget.quote.flowType,
          scheduledFor: editTarget.quote.scheduledFor?.toISOString() ?? null,
          snapshot:
            editTarget.quote.snapshot &&
            typeof editTarget.quote.snapshot === "object" &&
            !Array.isArray(editTarget.quote.snapshot)
              ? (editTarget.quote.snapshot as Record<string, unknown>)
              : null,
          items: editTarget.quote.items.map((item) => ({
            itemType:
              item.itemType === QuoteItemType.EXTRA
                ? ("EXTRA" as const)
                : item.itemType === QuoteItemType.ADJUSTMENT
                  ? ("ADJUSTMENT" as const)
                  : ("SERVICE" as const),
            label: item.label,
            quantity: item.quantity,
            total: item.total,
            metadata:
              item.metadata && typeof item.metadata === "object" && !Array.isArray(item.metadata)
                ? (item.metadata as Record<string, unknown>)
                : null,
          })),
        }
      : editTarget?.type === "order"
        ? {
            mode: "order" as const,
            entityId: editTarget.order.id,
            clientId: editTarget.order.client?.id ?? null,
            customerName: editTarget.order.customerName ?? editTarget.order.client?.name ?? "",
            customerPhone:
              editTarget.order.customerPhone ??
              (editTarget.order.client?.phone &&
              editTarget.order.client.phone !== "SIN_TELEFONO"
                ? editTarget.order.client.phone
                : "") ??
              "",
            notes: editTarget.order.notes ?? "",
            assignedToUserId: editTarget.order.assignedTo?.id ?? null,
            flowType: editTarget.order.flowType,
            scheduledFor: editTarget.order.scheduledFor?.toISOString() ?? null,
            status: editTarget.order.status,
            snapshot:
              editTarget.order.snapshot &&
              typeof editTarget.order.snapshot === "object" &&
              !Array.isArray(editTarget.order.snapshot)
                ? (editTarget.order.snapshot as Record<string, unknown>)
                : null,
            items: editTarget.order.items.map((item) => ({
              itemType:
                item.itemType === ServiceOrderItemType.EXTRA
                  ? ("EXTRA" as const)
                  : item.itemType === ServiceOrderItemType.ADJUSTMENT
                    ? ("ADJUSTMENT" as const)
                    : ("SERVICE" as const),
              label: item.label,
              quantity: item.quantity,
              total: item.total,
              metadata:
                item.metadata && typeof item.metadata === "object" && !Array.isArray(item.metadata)
                  ? (item.metadata as Record<string, unknown>)
                  : null,
            })),
          }
        : null;

  return (
    <div>
      <QuoteCalculatorV2
        config={config}
        timeZone={timeZone}
        organizationName={context.currentOrganization?.name ?? config.branding.businessName}
        presentation={presentation}
        assignableUsers={assignableUsers}
        canUseManualAdjustments={canUseManualAdjustments(
          context.user.role,
          context.currentOrganizationRole
        )}
        canSaveQuotes={access.canCreateQuotes}
        canSaveOrders={access.canCreateOrders}
        canChargeOrders={access.canChargeOrders}
        canScheduleOrders={access.canScheduleOrders}
        initialContext={{
          clientId: query.clientId?.trim() || null,
          customerName: query.customerName?.trim() || "",
          customerPhone: query.customerPhone?.trim() || "",
          intent: initialIntent,
        }}
        initialEditContext={initialEditContext}
      />
    </div>
  );
}
