import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "strong";
}

export function GlassPanel({
  children,
  className,
  variant = "default",
  ...rest
}: GlassPanelProps) {
  return (
    <div
      className={cn(
        variant === "strong" ? "glass-panel-strong" : "glass-panel",
        "rounded-3xl",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
