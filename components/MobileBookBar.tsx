import { Button } from "@/components/ui/Button";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";

export function MobileBookBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-950/10 bg-cream-50 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] pt-3 md:hidden">
      <div className="flex items-stretch gap-2">
        <Button href="/book" className="flex-1">
          Book Appointment
        </Button>
        {/* Renders nothing once installed or where install isn't possible. */}
        <InstallAppButton variant="bar" label="App" />
      </div>
    </div>
  );
}
