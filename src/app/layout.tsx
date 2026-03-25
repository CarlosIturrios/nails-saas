// nails-saas/src/app/layout.tsx

import type { Metadata } from "next";

import "./globals.css";
import { GlobalHomeButton } from "@/src/components/ui/GlobalHomeButton";
import { GlobalOrganizationSwitcherServer } from "@/src/components/organization/GlobalOrganizationSwitcherServer";

import { Playfair_Display, Poppins } from "next/font/google"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-playfair",
})

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-poppins",
})

export const metadata: Metadata = {
  title: "Gica Nails | Calculadora de Cotizaciones",
  description:
    "Calculadora profesional de cotizaciones para manicuristas modernas.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${poppins.variable} antialiased`}>
        {children}
        <GlobalOrganizationSwitcherServer />
        <GlobalHomeButton />
      </body>
    </html>
  );
}
