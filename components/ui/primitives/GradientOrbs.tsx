import { cn } from "@/lib/cn";

type OrbColor = "mint" | "peach" | "lavender" | "sky" | "rose";

interface GradientOrbsProps {
  className?: string;
  colors?: OrbColor[];
}

const orbColors: Record<OrbColor, string> = {
  mint: "bg-gradient-mint",
  peach: "bg-gradient-peach",
  lavender: "bg-gradient-lavender",
  sky: "bg-gradient-sky",
  rose: "bg-gradient-rose",
};

const defaultLayout = [
  { top: "-80px", left: "-60px", size: "300px", delay: "0s", color: "mint" as const },
  { top: "30%", left: "60%", size: "280px", delay: "3s", color: "peach" as const },
  { top: "58%", left: "-70px", size: "320px", delay: "6s", color: "lavender" as const },
  { top: "80%", left: "55%", size: "260px", delay: "2s", color: "sky" as const },
];

export function GradientOrbs({ className, colors }: GradientOrbsProps) {
  const layout = defaultLayout.map((orb, index) => ({
    ...orb,
    color: colors?.[index] ?? orb.color,
  }));

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
      aria-hidden="true"
    >
      {layout.map((orb, index) => (
        <div
          key={index}
          className={cn(
            "absolute animate-brandfloat rounded-full opacity-60 blur-[54px]",
            orbColors[orb.color]
          )}
          style={{
            top: orb.top,
            left: orb.left,
            width: orb.size,
            height: orb.size,
            animationDelay: orb.delay,
          }}
        />
      ))}
    </div>
  );
}
