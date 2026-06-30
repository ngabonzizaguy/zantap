import { GradientOrbs } from "@/components/ui/primitives";

export default function OnboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas">
      <GradientOrbs />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
