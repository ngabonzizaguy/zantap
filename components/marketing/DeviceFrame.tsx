import Image from "next/image";
import { cn } from "@/lib/cn";

interface DeviceFrameProps {
  src: string;
  alt: string;
  /** Native screenshot dimensions, used for aspect ratio. */
  width: number;
  height: number;
  variant?: "phone" | "terminal";
  priority?: boolean;
  className?: string;
}

/**
 * Product screenshots appear ONLY inside designed device hardware — never as
 * floating screenshot cards (ADR-0046 §5 / issue-03 constraint).
 */
export function DeviceFrame({
  src,
  alt,
  width,
  height,
  variant = "phone",
  priority = false,
  className,
}: DeviceFrameProps) {
  const isPhone = variant === "phone";
  return (
    <div
      className={cn(
        "relative bg-[#1c1917] shadow-[0_30px_80px_rgba(0,0,0,0.55)]",
        isPhone
          ? "rounded-[44px] p-[10px]"
          : "rounded-[24px] p-[12px]",
        className
      )}
    >
      {/* Side buttons */}
      <span className="absolute -left-[2px] top-[18%] h-14 w-[3px] rounded-l bg-[#292524]" />
      <span className="absolute -right-[2px] top-[26%] h-9 w-[3px] rounded-r bg-[#292524]" />
      <div
        className={cn(
          "relative overflow-hidden bg-[#0c0a09]",
          isPhone ? "rounded-[34px]" : "rounded-[14px]"
        )}
      >
        {isPhone ? (
          <span className="absolute left-1/2 top-2.5 z-10 h-[22px] w-[86px] -translate-x-1/2 rounded-pill bg-black/90" />
        ) : (
          <span className="absolute left-1/2 top-1.5 z-10 h-2 w-2 -translate-x-1/2 rounded-full bg-black/80 ring-1 ring-white/10" />
        )}
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          className="h-auto w-full"
        />
        {/* Glass sheen */}
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent" />
      </div>
    </div>
  );
}
