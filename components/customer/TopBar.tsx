import { Icon } from "@/components/ui/Icon";

interface TopBarProps {
  location: string;
}

export function TopBar({ location }: TopBarProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="glass-pill flex h-11 w-11 items-center justify-center rounded-[14px]">
        <Icon name="menu" size={20} className="text-zt-brown-dark" />
      </div>
      <div className="glass-pill flex h-10 items-center gap-2 rounded-full px-3.5">
        <Icon name="location" size={14} className="text-red-700" />
        <span className="text-[13px] font-semibold text-zt-brown">{location}</span>
      </div>
    </div>
  );
}
