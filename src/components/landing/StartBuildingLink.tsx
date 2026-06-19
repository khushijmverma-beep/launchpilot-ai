"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export function StartBuildingLink() {
  const { user, loading } = useAuth();
  const href = user ? "/start" : "/login";

  if (loading) {
    return (
      <span className="btn-primary mt-10 opacity-0" aria-hidden>
        Start Building
      </span>
    );
  }

  return (
    <Link href={href} className="btn-primary mt-10">
      Start Building
    </Link>
  );
}
