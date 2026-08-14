import {
  Binoculars,
  Check,
  ChevronRight,
  ClipboardList,
  Clock3,
  Copy,
  Eye,
  MapPin,
  Menu,
  Package,
  Phone,
  PhoneCall,
  Plus,
  ShoppingCart,
  SlidersHorizontal,
  Smartphone,
  Star,
  Truck,
  Utensils,
  UsersRound,
  WifiOff,
  X,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

export type IconName =
  | "menu"
  | "location"
  | "clock"
  | "star"
  | "plus"
  | "cart"
  | "chevronRight"
  | "close"
  | "phone"
  | "check"
  | "plate"
  | "momo"
  | "orders"
  | "inventory"
  | "dispatch"
  | "copy"
  | "call"
  | "wifiOff"
  | "leads"
  | "settings"
  | "prospects"
  | "eye"
  | "stock";

const icons: Record<IconName, LucideIcon> = {
  menu: Menu,
  location: MapPin,
  clock: Clock3,
  star: Star,
  plus: Plus,
  cart: ShoppingCart,
  chevronRight: ChevronRight,
  close: X,
  phone: Phone,
  check: Check,
  plate: Utensils,
  momo: Smartphone,
  orders: ClipboardList,
  inventory: Package,
  dispatch: Truck,
  copy: Copy,
  call: PhoneCall,
  wifiOff: WifiOff,
  leads: UsersRound,
  settings: SlidersHorizontal,
  prospects: Binoculars,
  eye: Eye,
  stock: Package,
};

interface IconProps extends Omit<LucideProps, "size"> {
  name: IconName;
  size?: number;
}

/**
 * Stable semantic adapter over Lucide. Call sites name the product concept,
 * while this module owns the polished glyph choice and shared stroke defaults.
 */
export function Icon({
  name,
  size = 24,
  strokeWidth = 1.8,
  className,
  ...props
}: IconProps) {
  const Glyph = icons[name];
  return (
    <Glyph
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      aria-hidden={props["aria-label"] ? undefined : true}
      {...props}
    />
  );
}
