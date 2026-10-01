"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-64 flex-col items-center justify-center text-center">
      <p className="text-sm font-semibold text-white">
        Unable to load admin data
      </p>
      <p className="mt-2 max-w-md text-xs text-white/50">
        Check the database connection and try again.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-4 rounded-xl bg-white px-4 py-2 text-xs font-bold text-black hover:bg-white/90"
      >
        Try again
      </button>
    </div>
  );
}
