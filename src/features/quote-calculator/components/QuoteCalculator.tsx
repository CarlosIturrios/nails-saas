//src/features/quote-calculator/components/QuoteCalculator.tsx
"use client"
import QuoteSummary from "./QuoteSummary"
import { decorationPrices } from "../data/pricing"
import { useQuoteCalculator } from "../hooks/useQuoteCalculator"
import { useState } from "react"
import Toast from "@/src/components/ui/Toast"
import Image from "next/image"
import { decorationLabels } from "../data/pricing"

export default function QuoteCalculator() {
  const {
    pricing,
    selectedTechniques,
    selectedSizes,
    extraTones,
    decorations,
    total,
    toggleTechnique,
    selectSize,
    adjustExtraTones,
    adjustDecoration,
    reset
  } = useQuoteCalculator()

  const [toastMessage, setToastMessage] = useState<string | null>(null)
  return (
    <div className="space-y-8 relative">
      <div className="sparkle" style={{ top: "10%", left: "5%" }} />
      <div className="sparkle" style={{ top: "30%", right: "8%", animationDelay: "1s" }} />
      <div className="sparkle" style={{ top: "65%", left: "15%", animationDelay: "2s" }} />
      {/* HEADER */}
      <header className="text-center mb-8 relative">
        <div className="flex justify-center mb-4">
          <Image
            src="/logo.png"
            alt="Gica Nails Logo"
            width={120}
            height={120}
            className="object-contain"
            priority
          />
        </div>

        <h1 className="font-['Playfair_Display'] text-4xl md:text-5xl font-bold shimmer-text">
          Gica Nails
        </h1>

        <p className="text-amber-700/80 text-lg font-light tracking-wide mt-2">
          Calculadora de Precios
        </p>

        <div className="section-divider mt-4 mx-auto w-32" />
      </header>

      {/* TECNICAS */}
      <section className="card-glam rounded-2xl p-6 shadow-lg">
        <h2 className="font-medium mb-4">
          💅 Técnicas (máx 2)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {Object.keys(pricing).map((tech) => (
            <button
              key={tech}
              onClick={() => {
                const success = toggleTechnique(tech)

                if (!success) {
                  setToastMessage("Solo puedes seleccionar hasta 2 técnicas")
                }
              }}
              className={`rounded-xl p-3 text-sm transition border 
              ${selectedTechniques.includes(tech)
                  ? "bg-[var(--accent)] border-[var(--primary)]"
                  : "bg-white border-gray-200 hover:bg-[var(--accent)]/50"
                }`}
            >
              {pricing[tech as keyof typeof pricing].label}
            </button>
          ))}
        </div>
      </section>

      {/* LARGOS */}
      {selectedTechniques.length > 0 && (
        <section className="card-glam rounded-2xl p-6 shadow-lg">
          <h2 className="font-medium mb-4">
            📏 Tamaño / Largo
          </h2>

          <div className="grid md:grid-cols-3 gap-3">
            {selectedTechniques.map((tech) =>
              pricing[tech as keyof typeof pricing].options.map((option) => (
                <button
                  key={`${tech}-${option.id}`}
                  onClick={() => selectSize(tech, option)}
                  className={`rounded-xl p-3 text-sm border transition
                  ${selectedSizes[tech]?.some(o => o.id === option.id)
                      ? "bg-[var(--accent)] border-[var(--primary)]"
                      : "bg-white border-gray-200 hover:bg-[var(--accent)]/50"
                    }`}
                >
                  <div>{pricing[tech as keyof typeof pricing].label}</div>
                  <div className="text-xs text-gray-500">
                    {option.label}
                  </div>
                  <div className="font-semibold mt-1">
                    ${option.price}
                  </div>
                </button>
              ))
            )}
          </div>
        </section>
      )}

      {/* TONOS */}
      <section className="card-glam rounded-2xl p-6 shadow-lg">
        <h2 className="font-medium mb-4">
          🎨 Tonos Extra
        </h2>
        <p className="text-sm text-amber-600 mb-4">
          Incluye 2 tonos lisos. Cada tono adicional: $2
        </p>

        <div className="flex items-center gap-4">
          <button
            onClick={() => adjustExtraTones(-1)}
            className="w-8 h-8 rounded-full border flex items-center justify-center"
          >
            −
          </button>

          <span className="text-lg font-semibold">
            {extraTones}
          </span>

          <button
            onClick={() => adjustExtraTones(1)}
            className="w-8 h-8 rounded-full border flex items-center justify-center"
          >
            +
          </button>
        </div>
      </section>

      {/* DECORACIONES */}
      <section className="card-glam rounded-2xl p-6 shadow-lg">
        <h2 className="font-medium mb-4">
          💎 Decoraciones
        </h2>

        <div className="space-y-3">
          {Object.keys(decorations).map((key) => (
            <div
              key={key}
              className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-50 to-white border border-amber-100"
            >
              <span className="text-sm">
                {decorationLabels[key as keyof typeof decorationLabels]}
              </span>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => adjustDecoration(key, -1)}
                  className="w-7 h-7 rounded-full border flex items-center justify-center"
                >
                  −
                </button>

                <span className="w-5 text-center">
                  {decorations[key]}
                </span>

                <button
                  onClick={() => adjustDecoration(key, 1)}
                  className="w-7 h-7 rounded-full border flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TOTAL */}
      <QuoteSummary
        pricing={pricing}
        selectedSizes={selectedSizes}
        extraTones={extraTones}
        decorations={decorations}
        decorationPrices={decorationPrices}
        total={total}
      />

      {total > 0 && (
        <button
          onClick={reset}
          className="mt-6 w-full py-4 rounded-xl btn-glam text-white font-semibold text-lg shadow-lg"
        >
          🔄 Nueva Cotización
        </button>
      )}
      {toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  )
}
