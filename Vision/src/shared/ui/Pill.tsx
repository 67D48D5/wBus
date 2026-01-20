// src/shared/ui/Pill.tsx

import { ReactNode, ElementType } from "react";

type PillTone = "soft" | "solid" | "muted" | "light" | "glass";
type PillSize = "sm" | "md";

const toneStyles: Record<PillTone, string> = {
  soft: "bg-blue-50 text-blue-600 border border-blue-100",
  solid: "bg-blue-600 text-white border border-blue-600",
  muted: "bg-slate-100 text-slate-600 border border-slate-200",
  light: "bg-white/20 text-white border border-white/30",
  glass:
    "bg-white/30 text-white border border-white/40 backdrop-blur-md",
};

const sizeStyles: Record<PillSize, string> = {
  sm: "px-2.5 py-0.5 text-[10px]",
  md: "px-3 py-1 text-xs",
};

type PillProps<T extends ElementType = "span"> = {
  as?: T;
  children: ReactNode;
  className?: string;
  tone?: PillTone;
  size?: PillSize;
};

export default function Pill<T extends ElementType = "span">({
  as,
  children,
  className = "",
  tone = "soft",
  size = "md",
}: PillProps<T>) {
  const Component = as ?? "span";

  return (
    <Component
      className={`
        inline-flex items-center gap-1.5 rounded-full
        font-semibold leading-none
        ${toneStyles[tone]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {children}
    </Component>
  );
}
