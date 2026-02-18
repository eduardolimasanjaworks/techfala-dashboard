'use client';

import { forwardRef } from 'react';

const CheckmarkSvg = () => (
  <svg width="16" height="16" viewBox="-3 -4 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" focusable="false" role="presentation" className="text-white">
    <path d="M1.49022 3.21486C1.2407 2.94412 0.818938 2.92692 0.548195 3.17644C0.277453 3.42597 0.260252 3.84773 0.509776 4.11847L2.91785 6.73131C3.2762 7.08204 3.80964 7.08204 4.14076 6.75092C4.18159 6.71082 4.18159 6.71082 4.38359 6.51218C4.57995 6.31903 4.79875 6.1037 5.03438 5.87167C5.70762 5.20868 6.38087 4.54459 7.00931 3.92318L7.0362 3.89659C8.15272 2.79246 9.00025 1.9491 9.47463 1.46815C9.73318 1.20602 9.73029 0.783922 9.46815 0.525367C9.20602 0.266812 8.78392 0.269712 8.52537 0.531843C8.05616 1.00754 7.21125 1.84829 6.09866 2.94854L6.07182 2.97508C5.4441 3.59578 4.77147 4.25926 4.09883 4.92165C3.90522 5.11231 3.72299 5.29168 3.55525 5.4567L1.49022 3.21486Z" fill="currentColor" stroke="currentColor" strokeWidth="0.5" />
  </svg>
);

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Label text (optional); use aria-label for icon-only */
  label?: React.ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { checked, onCheckedChange, onChange, className = '', label, id: idProp, ...props },
  ref
) {
  const id = idProp ?? `checkbox-${Math.random().toString(36).slice(2, 9)}`;
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e);
    onCheckedChange?.(e.target.checked);
  };

  return (
    <label
      htmlFor={id}
      className={`inline-flex items-center gap-2 cursor-pointer select-none group ${className}`}
      data-testid="clickable-checkbox"
    >
      <span className="relative inline-flex shrink-0 w-5 h-5 rounded border border-white/25 bg-transparent transition-colors group-hover:border-white/40 group-focus-within:border-[#8B5CF6]/60">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          {...props}
        />
        {checked && (
          <span className="absolute inset-0 flex items-center justify-center rounded bg-[#8B5CF6]/90 border border-[#8B5CF6]">
            <CheckmarkSvg />
          </span>
        )}
      </span>
      {label != null && <span className="text-ui-sm text-white/90">{label}</span>}
    </label>
  );
});
