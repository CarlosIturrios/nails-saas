"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function GlobalHomeButton() {
  const pathname = usePathname();

  if (
    !pathname ||
    pathname === "/home" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/admin")
  ) {
    return null;
  }

  return (
    <div className="fixed left-4 bottom-4 z-40 sm:left-6 sm:bottom-6 lg:left-8 xl:left-10">
      <Link
        href="/home"
        className="admin-secondary inline-flex items-center justify-center px-4 py-3 text-sm font-semibold shadow-sm backdrop-blur-sm"
      >
        Ir a Home
      </Link>
    </div>
  );
}
