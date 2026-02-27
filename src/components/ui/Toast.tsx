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

  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(true)

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
        fixed bottom-6 left-1/2 -translate-x-1/2
        flex items-center gap-2
        px-6 py-3
        text-white text-sm font-medium
        rounded-full
        backdrop-blur-md
        shadow-2xl
        z-[9999]
        transition-all duration-300
        ${styles[type]}
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
      `}
    >
      {icons[type]}
      {message}
    </div>
  )
}