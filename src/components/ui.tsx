import {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  forwardRef,
} from "react";

const base =
  "inline-flex items-center justify-center rounded-lg font-medium motion-safe:transition-[color,background-color,box-shadow,transform] motion-safe:duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 touch-manipulation";

const variants = {
  primary: "bg-primary text-white hover:bg-primary-hover shadow-sm motion-safe:active:scale-[0.97]",
  secondary:
    "bg-white text-foreground border border-border hover:bg-slate-50 shadow-sm motion-safe:active:scale-[0.97]",
  ghost: "text-muted hover:bg-slate-100 hover:text-foreground motion-safe:active:scale-[0.97]",
  danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm motion-safe:active:scale-[0.97]",
  success: "bg-success text-white hover:bg-green-700 shadow-sm motion-safe:active:scale-[0.97]",
};

const sizes = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className = "", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
});

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${className}`}
      {...props}
    />
  );
}

export function Textarea({
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`flex min-h-[100px] w-full rounded-lg border border-border bg-white px-3 py-2 text-sm placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${className}`}
      {...props}
    />
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

export function Spinner({ className = "", label = "Loading" }: { className?: string; label?: string }) {
  return (
    <div
      className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      role="status"
      aria-label={label}
    />
  );
}

export function Badge({
  children,
  variant = "default",
}: {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "muted";
}) {
  const styles = {
    default: "bg-blue-50 text-blue-700",
    success: "bg-green-50 text-green-700",
    warning: "bg-amber-50 text-amber-700",
    muted: "bg-slate-100 text-slate-600",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[variant]}`}
    >
      {children}
    </span>
  );
}
