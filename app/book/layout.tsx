import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function BookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grain relative flex min-h-full flex-1 flex-col bg-cream-50">
      <header className="sticky top-0 z-50 border-b border-ink-950/10 bg-cream-50">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Logo />
          <Link
            href="/"
            className="group flex items-center gap-2 text-sm font-semibold text-wine-900"
          >
            <span aria-hidden="true" className="transition-transform group-hover:-translate-x-1">&larr;</span>
            <span className="border-b border-wine-900/30 pb-0.5 group-hover:border-wine-900">Back to site</span>
          </Link>
        </div>
      </header>
      <main className="relative flex-1">{children}</main>
    </div>
  );
}
