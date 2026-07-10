import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "outline";
type ButtonSize = "default" | "kds";
type ButtonRadius = "pill" | "lg" | "xl";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  radius?: ButtonRadius;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-on-primary hover:bg-primary-active active:bg-primary-active",
  outline:
    "border border-hairline-strong bg-transparent text-ink hover:border-ink active:bg-canvas-soft",
};

const sizeStyles: Record<ButtonSize, string> = {
  default: "h-10 min-h-10 px-5 text-button",
  kds: "h-[60px] min-h-[60px] px-6 text-button",
};

const radiusStyles: Record<ButtonRadius, string> = {
  pill: "rounded-pill",
  lg: "rounded-brand-lg",
  xl: "rounded-brand-xl",
};

export function Button({
  variant = "primary",
  size = "default",
  radius = "pill",
  className,
  type = "button",
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        // Compositor-only transitions + press scale: every button gets
        // immediate tactile feedback without animating layout properties.
        "inline-flex items-center justify-center font-body font-medium transition-[color,background-color,border-color,box-shadow,transform] duration-150 active:scale-[0.98] disabled:active:scale-100",
        radiusStyles[radius],
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
