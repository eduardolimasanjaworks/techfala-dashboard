import React from "react";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AnimationDemoPage() {
    return (
        <div className="relative">
            <BackgroundGradientAnimation>
                <div className="absolute z-50 inset-0 flex flex-col items-center justify-center text-white font-bold px-4 pointer-events-none">
                    <p className="bg-clip-text text-transparent drop-shadow-2xl bg-gradient-to-b from-white/80 to-white/20 text-4xl md:text-6xl lg:text-8xl mb-6">
                        TechFala Dashboard
                    </p>
                    <p className="text-[#00D084] text-xl md:text-2xl font-light tracking-widest uppercase">
                        A IA de impacto que trabalha enquanto você dorme
                    </p>
                    <Link
                        href="/"
                        className="mt-12 pointer-events-auto flex items-center gap-2 px-6 py-3 bg-[#00D084] text-[#0B0B0B] rounded-lg font-semibold hover:bg-[#00965F] transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Voltar ao Dashboard
                    </Link>
                </div>
            </BackgroundGradientAnimation>
        </div>
    );
}
