"use client";

import { LogOut } from "lucide-react";

type LogoutButtonProps = {
  redirectTo: "/admin/login" | "/super-admin/login";
  className?: string;
  showLabel?: boolean;
};

export default function LogoutButton({
  redirectTo,
  className,
  showLabel = false,
}: LogoutButtonProps) {
  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.replace(redirectTo);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void logout()}
      aria-label="Sign out"
      title="Sign out"
      className={className}
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      {showLabel ? <span>Sign Out</span> : null}
      <span className="sr-only">Sign out</span>
    </button>
  );
}
