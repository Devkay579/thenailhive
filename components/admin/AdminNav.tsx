"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { signOut } from "@/app/admin/login/actions";
import { LogoMark } from "@/components/ui/Logo";
import { cn } from "@/lib/cn";

const GROUPS = [
  {
    label: "Today",
    links: [
      { href: "/admin", label: "Dashboard", exact: true },
      { href: "/admin/bookings", label: "Bookings" },
      { href: "/admin/calendar", label: "Calendar" },
      { href: "/admin/messages", label: "Messages" },
    ],
  },
  {
    label: "Studio",
    links: [
      { href: "/admin/availability", label: "Availability" },
      { href: "/admin/services", label: "Services" },
      { href: "/admin/gallery", label: "Gallery" },
      { href: "/admin/reviews", label: "Reviews" },
      { href: "/admin/about", label: "About Page" },
    ],
  },
  {
    label: "People",
    links: [
      { href: "/admin/clients", label: "Clients" },
      { href: "/admin/team", label: "Team" },
      { href: "/admin/settings", label: "Settings" },
    ],
  },
];

/** Unread/attention counts keyed by nav href, e.g. { "/admin/messages": 3 }. */
type NavBadges = Record<string, number>;

function badgeLabel(count: number) {
  return count > 99 ? "99+" : String(count);
}

function NavLinks({ onNavigate, badges = {} }: { onNavigate?: () => void; badges?: NavBadges }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-7">
      {GROUPS.map((group) => (
        <div key={group.label}>
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-blush-300/60">
            {group.label}
          </p>
          <div className="mt-2 flex flex-col gap-0.5">
            {group.links.map((link) => {
              const active = "exact" in link && link.exact ? pathname === link.href : pathname.startsWith(link.href);
              const badge = badges[link.href] ?? 0;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-cream-50 text-wine-900 shadow-[3px_3px_0_var(--color-blush-300)]"
                      : "text-cream-100/75 hover:bg-cream-50/5 hover:text-cream-50",
                  )}
                >
                  {link.label}
                  {badge > 0 ? (
                    <span
                      className={cn(
                        "min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] font-semibold leading-none",
                        active ? "bg-wine-900 text-cream-50" : "bg-blush-300 text-wine-950",
                      )}
                    >
                      {badgeLabel(badge)}
                      <span className="sr-only"> unread</span>
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-2.5 text-cream-50">
      <LogoMark className="h-7 w-7 text-blush-300" />
      <span>
        <span className="block font-display text-base font-semibold leading-none tracking-wide">THENAILHIVE</span>
        <span className="mt-1 block font-script text-sm italic leading-none text-blush-300">studio desk</span>
      </span>
    </Link>
  );
}

function LogOut() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="flex w-full items-center justify-between rounded-xl border border-cream-50/15 px-3 py-2 text-left text-sm font-medium text-cream-100/80 transition-colors hover:border-cream-50/40 hover:text-cream-50"
      >
        Log out
        <span aria-hidden="true">&rarr;</span>
      </button>
    </form>
  );
}

export function AdminSidebar({ badges }: { badges?: NavBadges }) {
  return (
    <aside className="grain grain-light sticky top-0 hidden h-dvh w-60 shrink-0 flex-col bg-wine-950 px-4 py-6 md:flex">
      <div className="px-2">
        <Brand />
      </div>
      <div className="mt-10 flex-1 overflow-y-auto">
        <NavLinks badges={badges} />
      </div>
      <div className="mt-6 space-y-3">
        <Link
          href="/"
          target="_blank"
          className="block px-3 text-xs text-cream-100/50 transition-colors hover:text-blush-300"
        >
          View live site &nearr;
        </Link>
        <LogOut />
      </div>
    </aside>
  );
}

export function AdminMobileNav({ badges }: { badges?: NavBadges }) {
  const [open, setOpen] = useState(false);
  const hasBadge = Object.values(badges ?? {}).some((n) => n > 0);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="sticky top-0 z-50 md:hidden">
      <div className="relative z-10 flex items-center justify-between bg-wine-950 px-4 py-3">
        <Brand />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : hasBadge ? "Open menu (unread messages)" : "Open menu"}
          aria-expanded={open}
          className="relative flex h-9 items-center gap-2 rounded-full border border-cream-50/30 px-3.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-cream-50"
        >
          {open ? "Close" : "Menu"}
          {hasBadge && !open ? (
            <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-blush-300 ring-2 ring-wine-950" />
          ) : null}
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.35, ease: [0.76, 0, 0.24, 1] }}
            className="grain grain-light fixed inset-0 z-0 flex flex-col overflow-y-auto bg-wine-950 px-4 pb-8 pt-20"
          >
            <NavLinks onNavigate={() => setOpen(false)} badges={badges} />
            <div className="mt-8">
              <LogOut />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
