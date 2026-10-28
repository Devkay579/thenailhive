import { Button } from "@/components/ui/Button";

export function MobileBookBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-950/10 bg-cream-50 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] pt-3 md:hidden">
      <Button href="/book" className="w-full">
        Book Appointment
      </Button>
    </div>
  );
}
