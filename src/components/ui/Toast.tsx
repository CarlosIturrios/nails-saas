// src/components/ui/Toast.tsx
"use client"

import { useEffect, useState } from "react"
import { CheckCircle, AlertCircle, Info } from "lucide-react"

interface ToastProps {
  message: string
  onClose: () => void
  type?: "success" | "error" | "info"
  duration?: number
}

export default function Toast({
  message,
  onClose,
  type = "error",
  duration = 2500
}: ToastProps) {

  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const styles = {
    success: "bg-emerald-600/90",
    error: "bg-rose-600/90",
    info: "bg-amber-600/90"
  }

  const icons = {
    success: <CheckCircle size={18} />,
    error: <AlertCircle size={18} />,
    info: <Info size={18} />
  }

  return (
    <div
      className={`
        fixed left-4 right-4 top-[calc(env(safe-area-inset-top)+5rem)]
        z-[9999] mx-auto flex max-w-[calc(100vw-2rem)] items-start gap-2
        rounded-2xl px-4 py-3 text-sm font-medium text-white
        backdrop-blur-md
        shadow-2xl
        transition-all duration-300
        md:bottom-6 md:left-1/2 md:right-auto md:top-auto md:w-auto md:max-w-md
        md:-translate-x-1/2 md:items-center md:rounded-full md:px-6
        ${styles[type]}
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 md:translate-y-4"}
      `}
    >
      {icons[type]}
      {message}
    </div>
  )
}
