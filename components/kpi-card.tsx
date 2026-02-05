'use client';

import { Card, Metric, Text } from '@tremor/react';

interface KpiCardProps {
    title: string;
    value: string | number;
    variant?: 'default' | 'success' | 'danger';
}

export function KpiCard({ title, value, variant = 'default' }: KpiCardProps) {
    const colorMap = {
        default: 'text-white',
        success: 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]',
        danger: 'text-rose-400 drop-shadow-[0_0_10px_rgba(251,113,133,0.3)]',
    };

    return (
        <Card className="relative overflow-hidden group rounded-2xl border border-white/5 bg-[#0A0A0F]/40 backdrop-blur-2xl transition-all duration-300 hover:border-white/10 hover:bg-[#0A0A0F]/60 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative z-10 p-2">
                <Text className="text-white/40 text-xs font-medium uppercase tracking-widest mb-1">{title}</Text>
                <Metric className={`text-3xl font-light tracking-tight ${colorMap[variant]}`}>{value}</Metric>
            </div>
        </Card>
    );
}
