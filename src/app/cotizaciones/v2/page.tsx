import { QuoteCalculatorV2 } from "@/src/features/quote-calculator-v2/components/QuoteCalculatorV2";
import { getOrganizationQuoteConfigView } from "@/src/features/quote-calculator-v2/lib/config";
import { requireCurrentOrganization } from "@/src/lib/organizations/context";

export default async function CotizacionesV2Page() {
  const context = await requireCurrentOrganization();
  const organizationId = context.currentOrganizationId;

  if (!organizationId) {
    return null;
  }

  const config = await getOrganizationQuoteConfigView(organizationId);

  return (
    <QuoteCalculatorV2
      config={config}
      organizationName={context.currentOrganization?.name ?? "Organización"}
      canUseManualAdjustments={
        context.user.role === "ADMIN" || context.currentOrganizationRole === "ADMIN"
      }
    />
  );
}
