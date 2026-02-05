'use client';

export function BottomGlow() {
    return (
        <div className="fixed bottom-0 left-0 w-full h-40 pointer-events-none z-50">
            <div className="absolute inset-0 bg-gradient-to-t from-[#8B5CF6]/30 via-[#8B5CF6]/10 to-transparent blur-3xl" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#A78BFA]/20 via-[#6D28D9]/5 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#8B5CF6] to-transparent opacity-50" />
        </div>
    );
}
