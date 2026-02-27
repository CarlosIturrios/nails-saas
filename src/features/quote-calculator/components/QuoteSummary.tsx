//src/features/quote-calculator/components/QuoteSummary.tsx
import { decorationLabels } from "../data/pricing"
import { useRef } from "react"
import html2canvas from "html2canvas"
import { PRECIO_TONO_EXTRA } from "../data/pricing"

type SizeOption = {
    id: string
    label: string
    price: number
}

type Props = {
    pricing: any
    selectedSizes: Record<string, SizeOption[]>
    extraTones: number
    decorations: Record<string, number>
    decorationPrices: Record<string, number>
    total: number
}

export default function QuoteSummary({
    pricing,
    selectedSizes,
    extraTones,
    decorations,
    decorationPrices,
    total
}: Props) {
    const summaryRef = useRef<HTMLDivElement>(null)

    const handleDownloadPNG = async () => {
        if (!summaryRef.current) return

        // Crear contenedor temporal
        const tempDiv = document.createElement("div")
        tempDiv.style.position = "fixed"
        tempDiv.style.left = "-10000px"
        tempDiv.style.top = "0"
        tempDiv.style.background = "#fff"
        tempDiv.style.padding = "20px"
        tempDiv.style.width = "400px"
        tempDiv.style.fontFamily = "Arial, sans-serif"
        tempDiv.style.color = "#000"
        tempDiv.style.border = "2px solid #FFD700"
        tempDiv.style.borderRadius = "12px"
        tempDiv.style.boxSizing = "border-box"

        // Logo
        const logo = document.createElement("img")
        logo.src = "/logo.png"
        logo.style.width = "100px"
        logo.style.height = "100px"
        logo.style.display = "block"
        logo.style.margin = "0 auto 20px auto"
        tempDiv.appendChild(logo)

        // Título
        const title = document.createElement("h2")
        title.textContent = "Cotización Gica Nails"
        title.style.textAlign = "center"
        title.style.color = "#D4AF37"
        title.style.marginBottom = "15px"
        tempDiv.appendChild(title)

        // Función para crear fila de texto
        const addRow = (label: string, value: string) => {
            const row = document.createElement("div")
            row.style.display = "flex"
            row.style.justifyContent = "space-between"
            row.style.marginBottom = "6px"

            const left = document.createElement("span")
            left.textContent = label

            const right = document.createElement("span")
            right.textContent = value
            right.style.fontWeight = "bold"

            row.appendChild(left)
            row.appendChild(right)
            tempDiv.appendChild(row)
        }

        // Técnicas
        Object.entries(selectedSizes).forEach(([tech, items]) => {
            items.forEach(item => {
                addRow(`${pricing[tech].label} - ${item.label}`, `$${item.price}`)
            })
        })

        // Tonos extra
        if (extraTones > 0) {
            addRow(`Tonos extra (${extraTones})`, `$${extraTones * PRECIO_TONO_EXTRA}`)
        }

        // Decoraciones
        Object.entries(decorations).forEach(([key, value]) => {
            if (value === 0) return
            const cost = value * decorationPrices[key]
            addRow(`${decorationLabels[key as keyof typeof decorationLabels]} (${value})`, `$${cost}`)
        })

        // Separador
        const separator = document.createElement("hr")
        separator.style.border = "1px dashed #FFD700"
        separator.style.margin = "15px 0"
        tempDiv.appendChild(separator)

        // Total
        const totalDiv = document.createElement("div")
        totalDiv.style.textAlign = "right"
        totalDiv.style.fontSize = "1.2em"
        totalDiv.style.fontWeight = "bold"
        totalDiv.style.color = "#D4AF37"
        totalDiv.textContent = `Total: $${total}`
        tempDiv.appendChild(totalDiv)

        document.body.appendChild(tempDiv)

        // Capturar PNG
        const canvas = await html2canvas(tempDiv, { scale: 3, backgroundColor: "#fff" })
        const dataUrl = canvas.toDataURL("image/png")
        document.body.removeChild(tempDiv)

        // Descargar PNG
        const link = document.createElement("a")
        link.href = dataUrl
        link.download = "cotizacion.png"
        link.click()
    }

    if (total === 0) {
        return (
            <section className="bg-gradient-to-br from-amber-100 via-yellow-50 to-white rounded-2xl p-6 shadow-xl border-2 border-amber-200">
                <p className="text-amber-600 italic text-center py-4">
                    Selecciona una técnica para comenzar ✨
                </p>
            </section>
        )
    }

    return (
        <section
            ref={summaryRef}
            className="bg-gradient-to-br from-amber-100 via-yellow-50 to-white rounded-2xl p-6 shadow-xl border-2 border-amber-200">
            <h2 className="text-lg font-semibold mb-4 text-center shimmer-text">
                ✨ Resumen ✨
            </h2>

            <div className="space-y-2 text-sm">

                {/* Técnicas */}
                {Object.entries(selectedSizes).flatMap(([tech, items]) =>
                    items.map(item => (
                        <div key={`${tech}-${item.id}`} className="flex justify-between">
                            <span>{pricing[tech].label} - {item.label}</span>
                            <span>${item.price}</span>
                        </div>
                    ))
                )}

                {/* Tonos extra */}
                {extraTones > 0 && (
                    <div className="flex justify-between">
                        <span>Tonos extra ({extraTones})</span>
                        <span>${extraTones * PRECIO_TONO_EXTRA}</span>
                    </div>
                )}

                {/* Decoraciones */}
                {Object.entries(decorations).map(([key, value]) => {
                    if (value === 0) return null
                    const cost = value * decorationPrices[key]
                    return (
                        <div key={key} className="flex justify-between">
                            <span className="capitalize">
                                {decorationLabels[key as keyof typeof decorationLabels]} ({value})
                            </span>
                            <span>${cost}</span>
                        </div>
                    )
                })}

            </div>

            <div className="section-divider my-4" />

            <div className="flex justify-between items-center">
                <span className="font-['Playfair_Display'] text-xl text-amber-900">
                    Total
                </span>

                <span className="text-3xl font-bold shimmer-text">
                    ${total}
                </span>
            </div>
            {/* Botón de descarga */}
            <div className="text-center">
                <button
                    onClick={handleDownloadPNG}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-lg shadow"
                >
                    Descargar Cotización
                </button>
            </div>
        </section>
    )
}