"use client";

import { usePathname } from "next/navigation";
import {
  CardListSkeleton,
  DetailSkeleton,
  FormSkeleton,
  LoadingHeader,
  Skeleton,
  StatCardsSkeleton,
  TableSkeleton,
} from "@/components/admin/Loading";

/* One loading screen for the whole admin, shaped like whichever page is on
   its way in. Every loading.tsx under app/admin/(dashboard) renders this --
   a loading.tsx only covers navigations *into* its own folder, so nested
   routes (bookings/[id], ...) need their own file to get instant feedback. */

function BookingsListSkeleton() {
  return (
    <>
      <div className="flex gap-1.5 overflow-hidden">
        {[44, 76, 104, 88, 92, 84, 76].map((w, i) => (
          <Skeleton key={i} className="h-8 shrink-0 rounded-full" style={{ width: w }} />
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <Skeleton className="h-[38px] w-40 rounded-xl" />
        <Skeleton className="h-[38px] w-60 rounded-xl" />
        <Skeleton className="h-[38px] w-20 rounded-full" />
        <Skeleton className="h-[38px] w-20 rounded-full" />
      </div>
      <TableSkeleton columns={7} rows={10} />
    </>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <StatCardsSkeleton />
      <div className="grid gap-6 lg:grid-cols-2">
        <DetailSkeleton rows={4} />
        <DetailSkeleton rows={4} />
      </div>
      <StatCardsSkeleton count={4} />
    </>
  );
}

function CalendarSkeleton() {
  return (
    <div className="rounded-2xl border border-ink-950/10 bg-[#fffdf9] p-4 sm:p-6">
      <div className="mb-4 flex justify-between">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square h-auto rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function GallerySkeleton() {
  return (
    <>
      <FormSkeleton fields={2} />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/5] h-auto rounded-xl" />
        ))}
      </div>
    </>
  );
}

type Screen = { title: string; label: string; action?: boolean; body: React.ReactNode };

function screenFor(pathname: string): Screen {
  const parts = pathname.replace(/\/$/, "").split("/").slice(2); // after "/admin"
  const [section, id, sub] = parts;

  switch (section) {
    case undefined:
      return { title: "Dashboard", label: "Painting in today's numbers…", body: <DashboardSkeleton /> };
    case "bookings":
      if (id === "new") return { title: "New booking", label: "Laying out the booking form…", body: <FormSkeleton fields={8} /> };
      if (id && sub === "edit") return { title: "Edit booking", label: "Opening the booking…", body: <FormSkeleton fields={8} /> };
      if (id)
        return {
          title: "Booking",
          label: "Opening the appointment card…",
          body: (
            <>
              <DetailSkeleton rows={2} />
              <div className="grid gap-6 lg:grid-cols-2">
                <DetailSkeleton rows={5} />
                <DetailSkeleton rows={4} />
              </div>
            </>
          ),
        };
      return { title: "Bookings", label: "Flipping through the appointment book…", action: true, body: <BookingsListSkeleton /> };
    case "clients":
      if (id)
        return {
          title: "Client",
          label: "Pulling up their file…",
          body: (
            <>
              <DetailSkeleton rows={4} />
              <TableSkeleton columns={5} rows={5} />
            </>
          ),
        };
      return { title: "Clients", label: "Gathering your clients…", body: <TableSkeleton columns={4} rows={10} /> };
    case "messages":
      return { title: "Messages", label: "Checking the inbox…", body: <CardListSkeleton /> };
    case "reviews":
      return {
        title: "Reviews",
        label: "Reading the love notes…",
        body: (
          <>
            <FormSkeleton fields={3} />
            <CardListSkeleton items={4} />
          </>
        ),
      };
    case "calendar":
      return { title: "Calendar", label: "Turning the pages…", body: <CalendarSkeleton /> };
    case "gallery":
      return { title: "Gallery", label: "Hanging the photos…", body: <GallerySkeleton /> };
    case "services":
      return { title: "Services & Pricing", label: "Printing the price list…", body: <FormSkeleton fields={6} /> };
    case "availability":
      return { title: "Availability", label: "Checking the diary…", body: <FormSkeleton fields={8} /> };
    case "about":
      return {
        title: "About Page",
        label: "Rereading your story…",
        body: (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square h-auto rounded-xl" />
              ))}
            </div>
            <FormSkeleton fields={6} />
          </>
        ),
      };
    case "team":
      return { title: "Team", label: "Rounding up the team…", body: <FormSkeleton fields={4} /> };
    case "settings":
      return { title: "Settings", label: "Opening the settings drawer…", body: <FormSkeleton fields={8} /> };
    default:
      return { title: "Studio Desk", label: "One moment…", body: <FormSkeleton /> };
  }
}

export function AdminRouteLoading() {
  const pathname = usePathname();
  const screen = screenFor(pathname);

  return (
    <div className="space-y-6" aria-busy="true">
      <LoadingHeader title={screen.title} label={screen.label} action={screen.action} />
      {screen.body}
    </div>
  );
}
