import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import "./globals.css";
import "./readability.css";
import "./structure.css";

const editorial = localFont({ src: [{ path: "../../public/fonts/garamond-variable.ttf", weight: "300 700", style: "normal" }, { path: "../../public/fonts/garamond-variable-italic.ttf", weight: "300 700", style: "italic" }], variable: "--font-editorial", display: "swap" });
const sans = localFont({ src: [{ path: "../../public/fonts/dm-sans-regular.ttf", weight: "400", style: "normal" }, { path: "../../public/fonts/dm-sans-semibold.ttf", weight: "600", style: "normal" }], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: "Salón de Belleza Pamela Viury | Alta peluquería y estética en Ciudad Juárez",
  description: "Salón de Belleza Pamela Viury: alta peluquería, color, uñas y maquillaje en Ciudad Juárez, Chihuahua. Reserve su cita en línea y descargue su comprobante en PDF.",
  applicationName: "Salón de Belleza Pamela Viury",
  keywords: ["salón de belleza", "Pamela Viury", "Ciudad Juárez", "Chihuahua", "peluquería", "balayage", "manicure", "maquillaje", "citas"],
  openGraph: { title: "Salón de Belleza Pamela Viury · Ciudad Juárez", description: "Alta peluquería, color y estética en Ciudad Juárez. Reserve su cita en línea.", locale: "es_MX", type: "website", siteName: "Salón de Belleza Pamela Viury", images: [{ url: "/images/hero.jpg", width: 1400, height: 1750, alt: "Salón de Belleza Pamela Viury en Ciudad Juárez" }] },
  robots: { index: true, follow: true },
};
export const viewport: Viewport = { themeColor: "#fbf7f0", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="es-MX" className={`${editorial.variable} ${sans.variable}`}><body>{children}</body></html>;
}
