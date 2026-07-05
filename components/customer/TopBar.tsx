import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

interface TopBarProps {
  location: string;
  /** When set, replaces the decorative menu icon with a back link to the KDS. */
  kdsBackHref?: string;
}

export function TopBar({ location, kdsBackHref }: TopBarProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      {kdsBackHref ? (
        <Link
          href={kdsBackHref}
          className="glass-pill flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 font-body text-[13px] font-semibold text-zt-brown transition-opacity hover:opacity-90 active:opacity-80"
        >
          <span aria-hidden className="text-[15px] leading-none">
            ←
          </span>
          Back to KDS
        </Link>
      ) : (
        <div className="glass-pill flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]">
          <Icon name="menu" size={20} className="text-zt-brown-dark" />
        </div>
      )}
      <div className="glass-pill flex h-10 min-w-0 items-center gap-2 rounded-full px-3.5">
        <Icon name="location" size={14} className="shrink-0 text-red-700" />
        <span className="truncate text-[13px] font-semibold text-zt-brown">
          {location}
        </span>
      </div>
    </div>
  );
}
