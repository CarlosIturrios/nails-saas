import { redirect } from "next/navigation";

import { QuoteCalculatorV2 } from "@/src/features/quote-calculator-v2/components/QuoteCalculatorV2";
import { getOrganizationQuoteConfigView } from "@/src/features/quote-calculator-v2/lib/config";
import { getIndustryPresentation } from "@/src/features/v2/presentation";
import { V2_ROUTES } from "@/src/features/v2/routing";
import {
  canUseManualAdjustments,
  getOperationalFrontendAccess,
} from "@/src/lib/authorization";
import { requireCurrentOrganization } from "@/src/lib/organizations/context";
import { listAssignableUsersForOrganization } from "@/src/lib/service-orders";

interface V2CapturePageProps {
  searchParams: Promise<{
    clientId?: string;
    customerName?: string;
    customerPhone?: string;
    intent?: string;
  }>;
}

export default async function V2CapturePage({
  searchParams,
}: V2CapturePageProps) {
  const context = await requireCurrentOrganization();
  const query = await searchParams;
  const access = getOperationalFrontendAccess(
    context.user.role,
    context.currentOrganizationRole,
    context.currentOrganizationPermissionProfile
  );

  if (!access.canUseNewSale) {
    redirect(V2_ROUTES.pending);
  }

  const [config, assignableUsers] = await Promise.all([
    getOrganizationQuoteConfigView(context.currentOrganizationId),
    listAssignableUsersForOrganization(context.currentOrganizationId),
  ]);
  const presentation = getIndustryPresentation({
    businessType: config.branding.businessType,
  });
  const initialIntent =
    query.intent === "quote" || query.intent === "order" || query.intent === "paid"
      ? query.intent
      : undefined;

  return (
    <div>
      <QuoteCalculatorV2
        config={config}
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
      />
    </div>
  );
}
