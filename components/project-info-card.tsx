'use client';

import { ReactNode } from 'react';

interface ProjectInfoCardProps {
    title: string;
    children: ReactNode;
    icon?: ReactNode;
}

export function ProjectInfoCard({ title, children, icon, className, noPadding = false }: ProjectInfoCardProps & { className?: string; noPadding?: boolean }) {
    return (
        <div className={`group relative overflow-hidden rounded-3xl border border-white/5 bg-[#0A0A0F]/60 backdrop-blur-2xl transition-all duration-500 hover:border-white/10 hover:shadow-2xl hover:shadow-[#8B5CF6]/5 ${className}`}>
            {/* Inner Glow Effect on Hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6]/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />

            {(title || icon) && (
                <div className="relative flex items-center gap-3 p-6 pb-2">
                    {icon && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-[#A78BFA] ring-1 ring-white/10 transition-transform duration-500 group-hover:scale-110 group-hover:text-white group-hover:ring-[#8B5CF6]/50">
                            {icon}
                        </div>
                    )}
                    {title && <h3 className="text-sm font-medium tracking-wide text-white/60 uppercase">{title}</h3>}
                </div>
            )}
            <div className={`relative ${noPadding ? '' : 'p-6'}`}>{children}</div>
        </div>
    );
}
