import { cn } from "@/lib/cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({
  label,
  error,
  id,
  className,
  disabled,
  ...props
}: InputProps) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? (
        <label
          htmlFor={inputId}
          className="font-body text-body-sm font-medium text-ink"
        >
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={cn(
          "h-11 min-h-11 w-full rounded-brand-md border bg-surface-card px-4 font-body text-body-md text-ink",
          "placeholder:text-muted-soft",
          "focus:border-2 focus:border-ink focus:px-[15px] focus:outline-none",
          error
            ? "border-error focus:border-error"
            : "border-hairline-strong",
          disabled && "cursor-not-allowed bg-canvas-soft text-muted-soft",
          className
        )}
        {...props}
      />
      {error ? (
        <p
          id={inputId ? `${inputId}-error` : undefined}
          className="font-body text-caption text-error"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
