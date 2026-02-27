// src/components/ui/LogoutButton.tsx
"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
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
      className={`btn-glam px-4 py-2 rounded-lg font-semibold text-white transition
        ${loading ? "opacity-50 cursor-not-allowed" : "hover:scale-105"}`}
    >
      {loading ? "Cerrando sesión..." : "Cerrar sesión"}
    </button>
  );
}