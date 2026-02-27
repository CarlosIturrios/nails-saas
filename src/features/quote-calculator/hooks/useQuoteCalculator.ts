// nails-saas/src/features/hooks/useQuoteCalculator.ts
"use client"

import { useState, useMemo } from "react"
import {
  MAX_TECNICAS,
  MAX_UNAS,
  PRECIO_TONO_EXTRA,
  pricing,
  decorationPrices
} from "../data/pricing"

export function useQuoteCalculator() {
  const [selectedTechniques, setSelectedTechniques] = useState<string[]>([])
  const [selectedSizes, setSelectedSizes] = useState<Record<string, any[]>>({})
  const [extraTones, setExtraTones] = useState(0)
  const [decorations, setDecorations] = useState<Record<string, number>>({
    pedreria: 0,
    relieve: 0,
    hoja_metalica: 0,
    espejo: 0,
    arcoiris: 0,
    aurora: 0,
    relleno: 0,
    reposicion: 0,
    dijes: 0,
    stickers: 0,
    naturaleza_muerta: 0,
  })

  const toggleTechnique = (tech: string): boolean => {
    if (selectedTechniques.includes(tech)) {
      setSelectedTechniques(prev => prev.filter(t => t !== tech))
      setSelectedSizes(prev => {
        const copy = { ...prev }
        delete copy[tech]
        return copy
      })
      return true
    }

    if (selectedTechniques.length >= MAX_TECNICAS) {
      return false
    }

    setSelectedTechniques(prev => [...prev, tech])
    return true
  }

  const selectSize = (tech: string, option: any) => {
    const techPricing = pricing[tech as keyof typeof pricing]

    if (techPricing.multiSelect) {
      // Toggle: si ya está seleccionada, quitarla
      setSelectedSizes(prev => {
        const current = prev[tech] || []
        if (current.find(o => o.id === option.id)) {
          return { ...prev, [tech]: current.filter(o => o.id !== option.id) }
        }
        return { ...prev, [tech]: [...current, option] }
      })
    } else {
      // Solo una opción
      setSelectedSizes(prev => ({ ...prev, [tech]: [option] }))
    }
  }

  const adjustExtraTones = (delta: number) => {
    setExtraTones(prev => Math.max(0, prev + delta))
  }

  const adjustDecoration = (key: string, delta: number) => {
    setDecorations(prev => ({
      ...prev,
      [key]: Math.max(0, Math.min(MAX_UNAS, prev[key] + delta))
    }))
  }

  const total = useMemo(() => {
    let sum = 0

    Object.values(selectedSizes).forEach((items: any[]) => {
      items.forEach(item => sum += item.price)
    })

    sum += extraTones * PRECIO_TONO_EXTRA

    Object.entries(decorations).forEach(([k, v]) => {
      if (v > 0) sum += v * decorationPrices[k as keyof typeof decorationPrices]
    })

    return sum
  }, [selectedSizes, extraTones, decorations])

  const reset = () => {
    setSelectedTechniques([])
    setSelectedSizes({})
    setExtraTones(0)
    setDecorations({
      pedreria: 0,
      relieve: 0,
      hoja_metalica: 0,
      espejo: 0,
      arcoiris: 0,
      aurora: 0,
      relleno: 0,
      reposicion: 0,
      dijes: 0,
      stickers: 0,
      naturaleza_muerta: 0,
    })
  }

  return {
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
  }
}
