// nails-saas/src/app/cotizaciones/page.tsx
import QuoteCalculator from "@/src/features/quote-calculator/components/QuoteCalculator"
import LogoutButton from "@/src/components/ui/LogoutButton"


export default function CotizacionesPage() {
  return (
    <main className="min-h-screen px-6 py-10 flex flex-col items-center">
      <div className="w-full max-w-4xl flex justify-end mb-6">
        <LogoutButton />
      </div>
      <QuoteCalculator />
    </main>
  )
}