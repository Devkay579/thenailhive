"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";

export function PageSizeSelect({
  pageSize,
  options,
  basePath,
  searchParams,
}: {
  pageSize: number;
  options: number[];
  basePath: string;
  searchParams: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string) {
    const params = new URLSearchParams();
    for (const [key, v] of Object.entries(searchParams)) {
      if (v && key !== "page" && key !== "perPage") params.set(key, v);
    }
    params.set("perPage", value);
    // Back to page 1 -- the old page number means something else now.
    startTransition(() => router.push(`${basePath}?${params.toString()}`));
  }

  return (
    <label className={cn("flex items-center gap-2 text-ink-700", isPending && "opacity-60")}>
      <span className="text-xs">Per page</span>
      <select
        value={pageSize}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.value)}
        className="rounded-full border border-ink-950/15 bg-[#fffdf9] py-1 pl-2.5 pr-7 text-xs font-medium text-ink-950 focus:border-wine-700 focus:outline-none"
      >
        {options.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </label>
  );
}
