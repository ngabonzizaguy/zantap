import type { SVGProps } from "react";

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
  | "call";

const paths: Record<IconName, React.ReactNode> = {
  menu: (
    <>
      <path d="M4 7h16M4 12h16M4 17h10" />
    </>
  ),
  location: (
    <>
      <path d="M12 21s-7-4.6-7-10a7 7 0 0 1 14 0c0 5.4-7 10-7 10z" />
      <circle cx="12" cy="11" r="2.4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  star: <path d="M12 3l2.6 5.6 6 .7-4.5 4 1.3 6L12 16.9 6.6 19.3l1.3-6L3.4 9.3l6-.7L12 3z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  cart: (
    <>
      <path d="M6 6h15l-1.5 9h-12z" />
      <path d="M6 6L5 3H3" />
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
    </>
  ),
  chevronRight: <path d="M9 6l6 6-6 6" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  phone: (
    <>
      <path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
    </>
  ),
  check: <path d="M5 13l4 4L19 7" />,
  plate: (
    <>
      <path d="M5 12a7 7 0 0 1 14 0" />
      <path d="M3 12h18" />
      <path d="M5 16h14" />
    </>
  ),
  momo: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="3" />
      <path d="M9 18h6" />
    </>
  ),
  orders: (
    <>
      <path d="M4 5h16v4H4zM5 9v10h14V9" />
      <path d="M9 13h6" />
    </>
  ),
  inventory: (
    <>
      <path d="M3 7l9-4 9 4-9 4-9-4z" />
      <path d="M3 7v10l9 4 9-4V7" />
      <path d="M12 11v10" />
    </>
  ),
  dispatch: (
    <>
      <circle cx="6" cy="17" r="2.5" />
      <circle cx="17" cy="17" r="2.5" />
      <path d="M8.5 17H14l-1.5-7H4" />
      <path d="M14 11h4l2.5 4v2h-2" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </>
  ),
  call: (
    <>
      <path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
    </>
  ),
};

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
