// src/components/ui/LogoutButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface LogoutButtonProps {
  className?: string;
}

export default function LogoutButton({ className = "" }: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/logout", { method: "POST" });
      router.push("/login");
    } catch (err) {
      console.error("Error cerrando sesión:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={`inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#e8dece] bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#d6c8b3] hover:bg-[#fffdf9] disabled:cursor-not-allowed disabled:opacity-50 ${className}`.trim()}
    >
      {loading ? "Cerrando sesión..." : "Cerrar sesión"}
    </button>
  );
}
