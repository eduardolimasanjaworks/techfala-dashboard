'use client';

interface SparklineProps {
    data: number[];
    color: 'purple' | 'red';
    height?: number;
}

export function Sparkline({ data, color, height = 40 }: SparklineProps) {
    if (!data || data.length === 0) return null;

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => {
        const x = (index / (data.length - 1)) * 100;
        const y = 100 - ((value - min) / range) * 100;
        return `${x},${y}`;
    }).join(' ');

    const colorMap = {
        purple: '#8B5CF6',
        red: '#EF4444',
    };

    return (
        <svg
            width="100%"
            height={height}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="w-full"
        >
            <polyline
                fill="none"
                stroke={colorMap[color]}
                strokeWidth="3"
                points={points}
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
}
