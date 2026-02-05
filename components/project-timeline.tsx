'use client';

import { CheckCircle2, Circle, AlertCircle, Flag } from 'lucide-react';

interface TimelineEvent {
    data: string;
    evento: string;
    tipo: 'inicio' | 'milestone' | 'atraso' | 'conclusao';
}

interface ProjectTimelineProps {
    events: TimelineEvent[];
}

export function ProjectTimeline({ events }: ProjectTimelineProps) {
    const getIcon = (tipo: TimelineEvent['tipo']) => {
        switch (tipo) {
            case 'inicio':
                return <Flag className="w-5 h-5 text-[#00D084]" />;
            case 'milestone':
                return <CheckCircle2 className="w-5 h-5 text-[#8B5CF6]" />;
            case 'atraso':
                return <AlertCircle className="w-5 h-5 text-red-500" />;
            case 'conclusao':
                return <CheckCircle2 className="w-5 h-5 text-[#00D084]" />;
            default:
                return <Circle className="w-5 h-5 text-[#9CA3AF]" />;
        }
    };

    const getColor = (tipo: TimelineEvent['tipo']) => {
        switch (tipo) {
            case 'inicio':
                return 'border-[#00D084]';
            case 'milestone':
                return 'border-[#8B5CF6]';
            case 'atraso':
                return 'border-red-500';
            case 'conclusao':
                return 'border-[#00D084]';
            default:
                return 'border-[#9CA3AF]';
        }
    };

    return (
        <div className="space-y-4">
            {events.map((event, index) => (
                <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className={`border-2 ${getColor(event.tipo)} rounded-full p-1 bg-[#151520]`}>
                            {getIcon(event.tipo)}
                        </div>
                        {index < events.length - 1 && (
                            <div className="w-0.5 h-12 bg-[#1F1F2E] mt-2" />
                        )}
                    </div>
                    <div className="flex-1 pb-8">
                        <p className="text-white font-medium mb-1">{event.evento}</p>
                        <p className="text-sm text-[#9CA3AF]">{event.data}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
