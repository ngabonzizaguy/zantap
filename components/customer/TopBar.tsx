import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

interface TopBarProps {
  location: string;
  /** When set, replaces the decorative menu icon with a back link to the KDS. */
  kdsBackHref?: string;
}

const chipClass = "glass-liquid-pill shadow-brand-soft";

export function TopBar({ location, kdsBackHref }: TopBarProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      {kdsBackHref ? (
        <Link
          href={kdsBackHref}
          className={cn(
            chipClass,
            "flex h-10 shrink-0 items-center gap-1.5 px-3.5 font-body text-body-sm font-medium text-ink transition-opacity hover:opacity-90 active:opacity-80"
          )}
        >
          <span aria-hidden className="text-[15px] leading-none">
            ←
          </span>
          Back to KDS
        </Link>
      ) : (
        <div
          className={cn(
            chipClass,
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-brand-lg"
          )}
        >
          <Icon name="menu" size={20} className="text-ink" />
        </div>
      )}
      <div
        className={cn(
          chipClass,
          "flex h-10 min-w-0 items-center gap-2 px-3.5"
        )}
      >
        <Icon name="location" size={14} className="shrink-0 text-muted" />
        <span className="truncate font-body text-body-sm font-medium text-ink">
          {location}
        </span>
      </div>
    </div>
  );
}
