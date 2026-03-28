import { redirect } from "next/navigation";
import { buildRouteWithSearch, V2_ROUTES } from "@/src/features/v2/routing";

interface CotizacionesV2PageProps {
  searchParams: Promise<{
    clientId?: string;
    customerName?: string;
    customerPhone?: string;
    intent?: string;
  }>;
}

export default async function CotizacionesV2Page({
  searchParams,
}: CotizacionesV2PageProps) {
  const query = await searchParams;
  redirect(
    buildRouteWithSearch(V2_ROUTES.capture, {
      clientId: query.clientId,
      customerName: query.customerName,
      customerPhone: query.customerPhone,
      intent:
        query.intent === "quote" || query.intent === "order" || query.intent === "paid"
          ? query.intent
          : undefined,
    })
  );
}
