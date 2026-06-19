"use client";

import Link from "next/link";
import { getStoredUser } from "@/lib/auth-session";
import { useLayoutEffect, useState } from "react";

export function StartBuildingLink() {
  const [href, setHref] = useState("/login");

  useLayoutEffect(() => {
    const sync = () => {
      setHref(getStoredUser() ? "/start" : "/login");
    };

    sync();
    window.addEventListener("launchpilot-auth-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("launchpilot-auth-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <Link href={href} className="btn-primary mt-10">
      Start Building
    </Link>
  );
}
