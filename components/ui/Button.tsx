import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "outline" | "light" | "ghost";
type Size = "sm" | "md" | "lg";

// Letterpress buttons: flat ink colour, 1px border, and a hard offset
// "block" shadow. Hover lifts the button off its block; pressing pushes it
// flush into it.
const base =
  "relative inline-flex items-center justify-center gap-2 rounded-full border font-medium tracking-wide whitespace-nowrap transition-[transform,box-shadow,background-color,color] duration-150 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:pointer-events-none disabled:opacity-60";

const variants: Record<Variant, string> = {
  primary:
    "border-wine-950 bg-wine-900 text-cream-50 shadow-[4px_4px_0_var(--color-blush-300)] hover:bg-wine-800 hover:shadow-[6px_6px_0_var(--color-blush-300)]",
  outline:
    "border-wine-900 bg-cream-50 text-wine-900 shadow-[4px_4px_0_var(--color-wine-900)] hover:shadow-[6px_6px_0_var(--color-wine-900)]",
  light:
    "border-cream-50 bg-cream-50 text-wine-900 shadow-[4px_4px_0_var(--color-blush-300)] hover:shadow-[6px_6px_0_var(--color-blush-300)]",
  ghost:
    "border-transparent text-wine-900 hover:translate-x-0 hover:translate-y-0 hover:bg-blush-100 active:translate-x-0 active:translate-y-0",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-5 text-sm",
  md: "h-11 px-6 text-sm sm:text-base",
  lg: "h-13 px-8 text-base sm:text-lg",
};

type LinkButtonProps = {
  href: string;
  target?: string;
  rel?: string;
  onClick?: () => void;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

type NativeButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "className"
> & {
  href?: undefined;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

export function Button(props: LinkButtonProps | NativeButtonProps) {
  const variant = props.variant ?? "primary";
  const size = props.size ?? "md";
  const classes = cn(base, variants[variant], sizes[size], props.className);

  if (props.href) {
    return (
      <Link
        href={props.href}
        target={props.target}
        rel={props.rel}
        onClick={props.onClick}
        className={classes}
      >
        {props.children}
      </Link>
    );
  }

  const { variant: _variant, size: _size, ...rest } = props as NativeButtonProps;
  void _variant;
  void _size;

  return (
    <button {...rest} className={classes}>
      {rest.children}
    </button>
  );
}
