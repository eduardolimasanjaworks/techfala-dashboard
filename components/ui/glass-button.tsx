import Link from 'next/link';
import { type ButtonHTMLAttributes, type AnchorHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils'; // Assuming this exists, or I will use simple manual concating if not. I'll assume standard shadcn-like setup or just use template literals.

// Fallback for cn if not available in this context, though it's likely present. 
// If generic, I'll stick to template literals to be safe.

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    href?: string;
    icon?: ReactNode;
    variant?: 'default' | 'primary'; // Primary could have a bit more tint if needed
}

export function GlassButton({ className, children, href, icon, variant = 'default', ...props }: GlassButtonProps & { href?: string }) {
    const baseStyles = `
        relative inline-flex items-center justify-center gap-2 px-5 py-2.5 overflow-hidden
        rounded-xl
        text-sm font-medium tracking-wide text-white
        transition-all duration-300 ease-out
        
        /* Glassmorphism Core */
        bg-white/5 backdrop-blur-[20px] backdrop-saturate-[180%]
        
        /* High-Fidelity Border */
        border border-white/10
        
        /* Depth & Glow */
        shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),_0_4px_20px_-2px_rgba(0,0,0,0.5)]
        
        /* Interaction */
        hover:bg-white/10 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),_0_6px_24px_-4px_rgba(0,0,0,0.6)]
        hover:border-white/20
        active:scale-[0.98] active:opacity-90
        
        /* Hardware Acceleration */
        transform-gpu
    `;

    // Optional: Primary variant with slight color tint (purple for this app)
    const variantStyles = variant === 'primary'
        ? "before:absolute before:inset-0 before:bg-purple-500/10 before:opacity-0 hover:before:opacity-100 before:transition-opacity"
        : "";

    const content = (
        <>
            {icon && <span className="relative z-10">{icon}</span>}
            <span className="relative z-10">{children}</span>
            {/* Shimmer effect optional */}
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent z-0" />
        </>
    );

    if (href) {
        return (
            <Link href={href} className={`${baseStyles} ${variantStyles} ${className} group`}>
                {content}
            </Link>
        );
    }

    return (
        <button className={`${baseStyles} ${variantStyles} ${className} group`} {...props}>
            {content}
        </button>
    );
}
