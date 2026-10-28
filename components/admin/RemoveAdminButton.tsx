"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteAdminUser } from "@/app/admin/team/actions";

export function RemoveAdminButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await deleteAdminUser(userId);
            if (!result.ok) {
              setError(result.message);
              toast.error(result.message);
            } else {
              toast.success("Admin account removed.");
              router.refresh();
            }
          })
        }
        className="text-xs font-medium text-wine-700 hover:underline disabled:opacity-60"
      >
        Remove
      </button>
      {error ? <p className="text-xs text-wine-700">{error}</p> : null}
    </div>
  );
}
