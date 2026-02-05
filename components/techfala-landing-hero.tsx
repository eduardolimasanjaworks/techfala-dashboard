import React from "react";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";

export function TechFalaLandingHero() {
    return (
        <BackgroundGradientAnimation>
            <div className="absolute z-50 inset-0 flex items-center justify-center text-white font-bold px-4 pointer-events-none text-center">
                <div className="max-w-4xl">
                    <p className="bg-clip-text text-transparent drop-shadow-2xl bg-gradient-to-b from-white to-[#B0B0B0] text-4xl md:text-7xl">
                        A IA de impacto que trabalha enquanto você dorme.
                    </p>
                    <p className="text-[#00D084] mt-4 text-xl md:text-2xl font-light tracking-widest uppercase">
                        Powered by TechFala
                    </p>
                </div>
            </div>
        </BackgroundGradientAnimation>
    );
}
