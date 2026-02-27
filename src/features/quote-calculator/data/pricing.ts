// nails-saas/src/features/data/pricing.ts
export const MAX_TECNICAS = 2
export const MAX_UNAS = 10
export const PRECIO_TONO_EXTRA = 2

export const pricing = {
  semipermanente: {
    label: "Gel Semipermanente",
    multiSelect: false,
    options: [
      { id: "1", label: "Largo 1", price: 180 },
      { id: "2", label: "Largo 2", price: 200 },
      { id: "3", label: "Largo 3", price: 200 },
      { id: "4", label: "Largo 4", price: 220 },
      { id: "5", label: "Largo 5", price: 220 },
      { id: "6", label: "Largo 6", price: 240 },
      { id: "7", label: "Largo 7", price: 250 }
    ]
  },
  softgel: {
    label: "Soft Gel",
    multiSelect: false,
    options: [
      { id: "xs", label: "XS", price: 200 },
      { id: "s", label: "S", price: 230 },
      { id: "m", label: "M", price: 260 },
      { id: "l", label: "L", price: 290 }
    ]
  },
  presson: {
    label: "Press On",
    multiSelect: false,
    options: [
      { id: "xs", label: "XS", price: 200 },
      { id: "s", label: "S", price: 230 },
      { id: "m", label: "M", price: 260 },
      { id: "l", label: "L", price: 300 }
    ]
  },
  retiro: {
    label: "Retiro",
    multiSelect: true,
    options: [
      { id: "semi", label: "Gel Semipermanente", price: 40 },
      { id: "soft", label: "Soft Gel", price: 50 },
      { id: "acri", label: "Acrílicas", price: 60 },
      { id: "ped", label: "Pedrería o Relieve", price: 10 }
    ]
  }
}

export const decorationPrices = {
  pedreria: 5,
  relieve: 10,
  hoja_metalica: 2,
  espejo: 5,
  arcoiris: 5,
  aurora: 5,
  relleno: 2,
  reposicion: 10,
  dijes: 10,
  stickers: 2,
  naturaleza_muerta: 2,
}

export const decorationLabels = {
  pedreria: "💎 Pedrería",
  relieve: "⛰️ Relieve",
  hoja_metalica: "🟨 Hoja metalica",
  espejo: "🪞 Efecto Espejo",
  arcoiris: "🌈 Efecto Arcoíris",
  aurora: "🌌 Efecto Aurora",
  relleno: "🖌️ Relleno",
  reposicion: "🔄 Reposición",
  dijes: "🧿 Dijes",
  stickers: "🧩 Stickers",
  naturaleza_muerta: "🥀 Naturaleza muerta",
}