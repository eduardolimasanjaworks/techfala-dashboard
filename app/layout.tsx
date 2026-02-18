import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NoiseOverlay } from "@/components/noise-overlay";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "TechFala Dashboard",
  description: "Gerenciamento de Projetos Premium",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} overflow-x-hidden`} suppressHydrationWarning>
      <body className="antialiased bg-[#1a1b26] text-[#e4e4e7] font-sans selection:bg-purple-500/30 overflow-x-hidden text-base" suppressHydrationWarning>
        <NoiseOverlay />
        {children}
      </body>
    </html>
  );
}
