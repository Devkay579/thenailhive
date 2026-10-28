import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { MobileBookBar } from "@/components/MobileBookBar";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <Nav />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <Footer />
      <MobileBookBar />
    </div>
  );
}
