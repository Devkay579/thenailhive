import type { Metadata } from "next";
import { LogoMark } from "@/components/ui/Logo";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Admin Login | THENAILHIVE",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="grid min-h-full flex-1 bg-cream-50 lg:grid-cols-2">
      {/* Brand panel */}
      <div className="grain grain-light relative hidden flex-col justify-between overflow-hidden bg-wine-950 p-12 text-cream-50 lg:flex">
        <div className="flex items-center gap-2.5">
          <LogoMark className="h-7 w-7 text-blush-300" />
          <span className="font-display text-lg font-semibold tracking-wide">THENAILHIVE</span>
        </div>
        <p className="font-display text-5xl font-semibold leading-[1.02] tracking-tight">
          Your chair,
          <br />
          <span className="font-script font-medium italic text-blush-300">your schedule.</span>
        </p>
        <p className="text-xs text-cream-100/50">Studio desk &middot; staff only</p>
      </div>

      <div className="grain flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2.5 lg:hidden">
            <LogoMark className="h-7 w-7 text-wine-900" />
            <span className="font-display text-lg font-semibold tracking-wide text-wine-900">THENAILHIVE</span>
          </div>
          <h1 className="mt-8 font-display text-4xl font-semibold tracking-tight text-ink-950 lg:mt-0">
            Welcome <span className="font-script font-medium italic text-wine-900">back.</span>
          </h1>
          <p className="mt-2 text-sm text-ink-700">Sign in to the studio desk.</p>
          <div className="mt-8">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
