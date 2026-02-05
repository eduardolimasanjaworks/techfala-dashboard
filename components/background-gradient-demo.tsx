import React from "react";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";

export function BackgroundGradientAnimationDemo() {
    return (
        <BackgroundGradientAnimation>
            <div className="absolute z-50 inset-0 flex items-center justify-center text-white font-bold px-4 pointer-events-none text-3xl text-center md:text-4xl lg:text-7xl">
                <p className="bg-clip-text text-transparent drop-shadow-2xl bg-gradient-to-b from-white/80 to-white/20">
                    TechFala Dashboard
                </p>
                <p className="text-[#00D084] mt-4 text-xl md:text-2xl font-light tracking-widest uppercase">
                    Powered by AI
                </p>
            </div>
        </BackgroundGradientAnimation>
    );
}
