type ThemeName = "Blush" | "Cool" | "Lavender";

const themes: Record<ThemeName, [string, string][]> = {
  Blush: [
    ["#ffcdb0", "#f59a6b"],
    ["#f7c0d2", "#e88bb0"],
    ["#e4d2f3", "#bfa0e6"],
    ["#ffe7b0", "#f5c45c"],
  ],
  Cool: [
    ["#bfe0f2", "#79b7e0"],
    ["#c9ecd6", "#83cba2"],
    ["#e4d2f3", "#bfa0e6"],
    ["#ffd9cf", "#f3a890"],
  ],
  Lavender: [
    ["#e4d2f3", "#bf9fe6"],
    ["#f7c0d2", "#e88bb0"],
    ["#cdd6f5", "#9fb0e6"],
    ["#ffe0ef", "#f5b0d0"],
  ],
};

interface OrbsProps {
  theme?: ThemeName;
}

export function Orbs({ theme = "Blush" }: OrbsProps) {
  const palette = themes[theme];
  const positions = [
    { top: "-80px", left: "-60px", size: "300px", delay: "0s" },
    { top: "30%", left: "60%", size: "280px", delay: "3s" },
    { top: "58%", left: "-70px", size: "320px", delay: "6s" },
    { top: "80%", left: "55%", size: "260px", delay: "2s" },
  ];

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {positions.map((pos, index) => (
        <div
          key={index}
          className="absolute animate-brandfloat rounded-full opacity-[0.62] blur-[54px]"
          style={{
            top: pos.top,
            left: pos.left,
            width: pos.size,
            height: pos.size,
            animationDelay: pos.delay,
            background: `radial-gradient(circle at 35% 30%, ${palette[index][0]}, ${palette[index][1]})`,
          }}
        />
      ))}
    </div>
  );
}
