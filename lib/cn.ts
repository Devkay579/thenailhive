import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind class strings, resolving conflicts (e.g. a passed-in
 * `text-cream-50` correctly overriding a variant's `text-wine-900`) the way
 * plain string concatenation can't -- Tailwind's generated stylesheet order
 * doesn't follow the order classes appear in a `class` attribute, so two
 * same-property utilities can silently pick the "wrong" one.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
