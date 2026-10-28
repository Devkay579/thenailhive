"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The open menu covers the page, so stop the page scrolling underneath it.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-colors duration-300",
        open
          ? "border-transparent bg-wine-950"
          : scrolled
            ? "border-ink-950/10 bg-cream-50 shadow-[0_10px_30px_-18px_rgb(74_22_32/0.35)]"
            : "border-ink-950/10 bg-cream-50",
      )}
    >
      {/* Mobile menu: a solid, full-height sheet beneath the header bar. */}
      <AnimatePresence>
        {open ? (
          <motion.nav
            key="mobile-menu"
            aria-label="Mobile"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.45, ease: [0.76, 0, 0.24, 1] }}
            className="grain grain-light fixed inset-0 z-0 flex flex-col bg-wine-950 px-6 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] pt-24 text-cream-50 md:hidden"
          >
            <ul className="flex flex-col">
              {LINKS.map((link, i) => {
                const active = pathname === link.href;
                return (
                  <motion.li
                    key={link.href}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.05, duration: 0.4 }}
                    className="border-b border-cream-50/10"
                  >
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="flex items-baseline gap-4 py-4"
                    >
                      <span className="w-7 font-display text-sm italic text-blush-300/70">
                        0{i + 1}
                      </span>
                      <span
                        className={cn(
                          "font-display text-4xl font-semibold tracking-tight",
                          active ? "text-blush-300" : "text-cream-50",
                        )}
                      >
                        {link.label}
                      </span>
                      {active ? (
                        <span className="ml-auto font-script text-lg italic text-blush-300">
                          you&apos;re here
                        </span>
                      ) : null}
                    </Link>
                  </motion.li>
                );
              })}
            </ul>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="mt-auto flex flex-col gap-4"
            >
              <p className="font-script text-2xl italic text-blush-300">
                Where your nails become the statement.
              </p>
              <Button href="/book" variant="light" size="lg" onClick={() => setOpen(false)}>
                Book an Appointment
              </Button>
            </motion.div>
          </motion.nav>
        ) : null}
      </AnimatePresence>

      <div className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <Logo className={cn("transition-colors", open && "text-cream-50")} />

        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative py-1 text-sm font-medium transition-colors",
                  active ? "text-wine-900" : "text-ink-700 hover:text-wine-900",
                )}
              >
                {link.label}
                {active ? (
                  <motion.span
                    layoutId="nav-underline"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    className="absolute inset-x-0 -bottom-0.5 h-[2px] bg-wine-900"
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:block">
          <Button href="/book" size="sm">
            Book Now
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className={cn(
            "flex h-10 items-center gap-2 rounded-full border px-4 text-xs font-semibold uppercase tracking-[0.2em] transition-colors md:hidden",
            open ? "border-cream-50/30 text-cream-50" : "border-wine-900 text-wine-900",
          )}
        >
          {open ? "Close" : "Menu"}
          <span aria-hidden="true" className="relative block h-2.5 w-4">
            <span
              className={cn(
                "absolute left-0 h-[1.5px] w-full bg-current transition-transform duration-300",
                open ? "top-1/2 rotate-45" : "top-0",
              )}
            />
            <span
              className={cn(
                "absolute left-0 h-[1.5px] w-full bg-current transition-transform duration-300",
                open ? "top-1/2 -rotate-45" : "bottom-0",
              )}
            />
          </span>
        </button>
      </div>
    </header>
  );
}
