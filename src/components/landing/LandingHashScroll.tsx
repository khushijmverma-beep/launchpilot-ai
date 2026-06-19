"use client";

import { useEffect } from "react";

export function LandingHashScroll() {
  useEffect(() => {
    function scrollToHash() {
      const hash = window.location.hash;
      if (!hash) return;
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, []);

  return null;
}
