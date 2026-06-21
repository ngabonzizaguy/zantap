import { Icon } from "@/components/ui/Icon";
import { GlassPanel } from "@/components/ui/GlassPanel";

interface HeroProps {
  tagline: string;
  restaurantName: string;
  deliveryTime: string;
  rating?: number;
}

export function Hero({
  tagline,
  restaurantName,
  deliveryTime,
  rating = 4.8,
}: HeroProps) {
  return (
    <GlassPanel variant="strong" className="relative overflow-hidden p-6">
      <div className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-[radial-gradient(circle_at_35%_30%,#ffd9b8,#f5a06b)] opacity-50 blur-xl" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex h-16 w-16 flex-none items-center justify-center rounded-[20px] border border-white/80 bg-gradient-to-br from-[#fff7f0] to-[#f6dccb] shadow-[0_10px_24px_rgba(180,120,90,0.24),inset_0_1px_0_rgba(255,255,255,0.9)]">
          <svg width="34" height="34" viewBox="0 0 48 48" fill="none" stroke="#b5773f" strokeWidth="1.6" strokeLinejoin="round">
            <path d="M24 6l13 7.5v15L24 36 11 28.5v-15L24 6z" />
            <path d="M24 14l7 4v8l-7 4-7-4v-8l7-4z" />
            <path d="M24 22l3.5 2v4L24 30l-3.5-2v-4L24 22z" fill="#b5773f" stroke="none" />
          </svg>
        </div>

        <button
          type="button"
          aria-label="Share storefront"
          className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-white/70 bg-white/55 text-zt-brown-muted backdrop-blur-md transition-colors hover:text-zt-brown"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
          </svg>
        </button>
      </div>

      <div className="relative mt-5">
        <div className="text-[11px] font-bold uppercase tracking-[1.6px] text-[#b07a5e]">
          {tagline}
        </div>
        <h1 className="mt-1 font-serif text-[34px] leading-[1.05] text-zt-brown">
          {restaurantName}
        </h1>
      </div>

      <div className="relative mt-5 flex flex-wrap items-center gap-2">
        <div className="flex h-9 items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-3.5 shadow-[0_4px_12px_rgba(170,110,100,0.12)]">
          <Icon name="clock" size={14} className="text-zt-brown-dark" />
          <span className="text-[13px] font-semibold text-zt-brown-dark">{deliveryTime}</span>
        </div>
        <div className="flex h-9 items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-3.5 shadow-[0_4px_12px_rgba(170,110,100,0.12)]">
          <Icon name="star" size={14} className="fill-[#f5b300] stroke-[#f5b300]" />
          <span className="text-[13px] font-semibold text-zt-brown-dark">{rating}</span>
          <span className="text-[13px] font-medium text-zt-warm">· Free delivery</span>
        </div>
      </div>
    </GlassPanel>
  );
}
