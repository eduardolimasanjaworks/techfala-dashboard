'use client';

interface StatusChartProps {
    data: {
        label: string;
        value: number;
        color: string;
    }[];
}

export function StatusPieChart({ data }: StatusChartProps) {
    const total = data.reduce((sum, item) => sum + item.value, 0);

    // Calcula os ângulos para cada seção
    let currentAngle = -90; // Começa do topo
    const sections = data.map(item => {
        const percentage = (item.value / total) * 100;
        const angle = (percentage / 100) * 360;
        const startAngle = currentAngle;
        currentAngle += angle;

        return {
            ...item,
            percentage,
            startAngle,
            endAngle: currentAngle,
        };
    });

    // Função para calcular coordenadas do arco SVG
    const describeArc = (centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number) => {
        const start = polarToCartesian(centerX, centerY, radius, endAngle);
        const end = polarToCartesian(centerX, centerY, radius, startAngle);
        const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

        return [
            'M', centerX, centerY,
            'L', start.x, start.y,
            'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
            'Z'
        ].join(' ');
    };

    const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
        const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    };

    const centerX = 120;
    const centerY = 120;
    const radius = 100;
    const innerRadius = 60;

    return (
        <div className="flex items-center gap-8">
            {/* Gráfico de Pizza (Donut) */}
            <div className="relative">
                <svg width="240" height="240" viewBox="0 0 240 240">
                    {/* Círculo externo */}
                    {sections.map((section, index) => (
                        <path
                            key={index}
                            d={describeArc(centerX, centerY, radius, section.startAngle, section.endAngle)}
                            fill={section.color}
                            className="transition-opacity hover:opacity-80 cursor-pointer"
                        />
                    ))}

                    {/* Círculo interno para criar efeito donut */}
                    <circle cx={centerX} cy={centerY} r={innerRadius} fill="#0A0A0F" />

                    {/* Total no centro */}
                    <text
                        x={centerX}
                        y={centerY - 10}
                        textAnchor="middle"
                        className="text-4xl font-bold fill-white"
                    >
                        {total}
                    </text>
                    <text
                        x={centerX}
                        y={centerY + 15}
                        textAnchor="middle"
                        className="text-sm fill-[#9CA3AF]"
                    >
                        Projetos
                    </text>
                </svg>
            </div>

            {/* Legenda */}
            <div className="flex-1 space-y-3">
                {sections.map((section, index) => (
                    <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-[#0A0A0F] rounded-lg hover:bg-[#151520] transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: section.color }}
                            />
                            <span className="text-sm text-white">{section.label}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-lg font-bold text-white">{section.value}</span>
                            <span className="text-xs text-[#9CA3AF] ml-2">
                                ({section.percentage.toFixed(0)}%)
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
