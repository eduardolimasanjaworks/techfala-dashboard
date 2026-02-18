'use client';

interface BurndownChartProps {
    // Array representing work remaining at each time point (should decrease over time)
    workRemaining: number[];
    // Total work at start (for calculating ideal line)
    totalWork?: number;
    color: 'purple' | 'red';
    height?: number;
}

export function BurndownChart({
    workRemaining,
    totalWork,
    color,
    height = 48
}: BurndownChartProps) {
    if (!workRemaining || workRemaining.length === 0) return null;

    // Use provided totalWork or the first value in the array as starting point
    const startWork = totalWork ?? workRemaining[0];
    const endWork = 0; // Ideal end is always zero work remaining

    // Calculate ideal burndown line (straight line from start to zero)
    const idealLine = workRemaining.map((_, index) => {
        const progress = index / (workRemaining.length - 1);
        return startWork - (progress * startWork);
    });

    // Find max value for scaling (use start work as max)
    const maxValue = Math.max(startWork, ...workRemaining);
    const minValue = 0; // Always zero as we want to show down to no work remaining
    const range = maxValue - minValue || 1;

    // Convert data points to SVG coordinates
    // Note: Y-axis is inverted (0 is at top in SVG), so we need to flip it
    const createPoints = (values: number[]) => {
        return values.map((value, index) => {
            const x = (index / (values.length - 1)) * 100;
            // Invert Y so high values (more work) appear at top
            const y = ((maxValue - value) / range) * 100;
            return `${x},${y}`;
        }).join(' ');
    };

    const actualPoints = createPoints(workRemaining);
    const idealPoints = createPoints(idealLine);

    const colorMap = {
        purple: {
            actual: '#8B5CF6',
            ideal: '#A78BFA',
            fill: 'rgba(139, 92, 246, 0.1)',
            warning: '#F59E0B',
        },
        red: {
            actual: '#EF4444',
            ideal: '#FCA5A5',
            fill: 'rgba(239, 68, 68, 0.1)',
            warning: '#DC2626',
        },
    };

    const colors = colorMap[color];

    // Proporção: atrasado se trabalho restante > ideal; adiantado se < ideal
    const currentIndex = workRemaining.length - 1;
    const currentActual = workRemaining[currentIndex];
    const currentIdeal = idealLine[currentIndex];
    const isBehind = currentActual > currentIdeal;
    const isAhead = currentActual < currentIdeal && currentActual > 0;

    return (
        <div className="relative w-full" style={{ height: `${height}px` }}>
            {isBehind && (
                <div
                    role="alert"
                    className="absolute -top-10 right-0 z-10 flex items-center gap-1.5 rounded-md border border-amber-500/50 bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-300 shadow-md"
                >
                    <span aria-hidden>⚠</span>
                    <span>Atrasado em relação ao ideal</span>
                </div>
            )}
            {isAhead && (
                <div
                    role="status"
                    className="absolute -top-10 right-0 z-10 flex items-center gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-400 shadow-md"
                >
                    <span aria-hidden>✓</span>
                    <span>Adiantado em relação ao ideal</span>
                </div>
            )}
            <svg
                width="100%"
                height={height}
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="w-full"
            >
                {/* Grid lines for better readability */}
                <line
                    x1="0"
                    y1="25"
                    x2="100"
                    y2="25"
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth="0.5"
                    vectorEffect="non-scaling-stroke"
                />
                <line
                    x1="0"
                    y1="50"
                    x2="100"
                    y2="50"
                    stroke="rgba(255, 255, 255, 0.12)"
                    strokeWidth="0.5"
                    vectorEffect="non-scaling-stroke"
                />
                <line
                    x1="0"
                    y1="75"
                    x2="100"
                    y2="75"
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth="0.5"
                    vectorEffect="non-scaling-stroke"
                />

                {/* Fill area between actual line and bottom (showing work completed) */}
                <polygon
                    points={`0,100 ${actualPoints} 100,100`}
                    fill={colors.fill}
                />

                {/* Ideal burndown line (dashed straight line) */}
                <polyline
                    fill="none"
                    stroke={colors.ideal}
                    strokeWidth="2"
                    strokeDasharray="4,4"
                    points={idealPoints}
                    vectorEffect="non-scaling-stroke"
                    opacity="0.6"
                />

                {/* Actual burndown line */}
                <polyline
                    fill="none"
                    stroke={isBehind ? colors.warning : colors.actual}
                    strokeWidth="3"
                    points={actualPoints}
                    vectorEffect="non-scaling-stroke"
                />

                {/* Dots on actual line for emphasis */}
                {workRemaining.map((value, index) => {
                    const x = (index / (workRemaining.length - 1)) * 100;
                    const y = ((maxValue - value) / range) * 100;

                    // Highlight the last point (current status)
                    const isLastPoint = index === workRemaining.length - 1;

                    return (
                        <circle
                            key={index}
                            cx={x}
                            cy={y}
                            r={isLastPoint ? "2.5" : "1.5"}
                            fill={isBehind && isLastPoint ? colors.warning : colors.actual}
                            vectorEffect="non-scaling-stroke"
                            opacity={isLastPoint ? 1 : 0.8}
                        />
                    );
                })}

                {/* Labels for axis */}
                <text
                    x="2"
                    y="8"
                    fontSize="8"
                    fill="rgba(255, 255, 255, 0.6)"
                    vectorEffect="non-scaling-stroke"
                >
                    {Math.round(maxValue)}
                </text>
                <text
                    x="2"
                    y="98"
                    fontSize="8"
                    fill="rgba(255, 255, 255, 0.6)"
                    vectorEffect="non-scaling-stroke"
                >
                    0
                </text>
            </svg>

            {/* Legenda (Real / Ideal) — sem aviso, que fica separado acima */}
            <div className="absolute -bottom-6 left-0 flex items-center gap-4 text-sm text-[#a1a1aa]">
                <div className="flex items-center gap-1.5">
                    <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: isBehind ? colors.warning : colors.actual }}
                    />
                    <span>Real</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-1 rounded" style={{ backgroundColor: colors.ideal }} />
                    <span>Ideal</span>
                </div>
            </div>
        </div>
    );
}
