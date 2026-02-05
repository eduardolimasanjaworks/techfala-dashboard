import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { NoiseOverlay } from "@/components/noise-overlay";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
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
    <html lang="pt-BR" className={`${outfit.variable}`}>
      <body className="antialiased bg-[#050508] text-white font-sans selection:bg-purple-500/30">
        <NoiseOverlay />
        {children}
      </body>
    </html>
  );
}
