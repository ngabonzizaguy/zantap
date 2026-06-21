import { cn } from "@/lib/cn";

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "strong";
}

export function GlassPanel({
  children,
  className,
  variant = "default",
}: GlassPanelProps) {
  return (
    <div
      className={cn(
        variant === "strong" ? "glass-panel-strong" : "glass-panel",
        "rounded-3xl",
        className
      )}
    >
      {children}
    </div>
  );
}
