"use client";

import { useEffect, useRef, useState } from "react";

type CountUpProps = {
  end: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  className?: string;
};

export function CountUp({
  end,
  duration = 2000,
  suffix = "",
  prefix = "",
  decimals = 0,
  className = "",
}: CountUpProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const runAnimation = () => {
      if (hasAnimated.current) return;
      hasAnimated.current = true;
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(eased * end);
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) runAnimation();
      },
      { threshold: 0.1, rootMargin: "0px 0px -5% 0px" },
    );

    observer.observe(el);

    // Animate immediately if already in viewport (e.g. large screens)
    requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        runAnimation();
      }
    });

    return () => observer.disconnect();
  }, [end, duration]);

  const formatted = decimals > 0 ? count.toFixed(decimals) : Math.floor(count).toLocaleString();

  return (
    <span ref={ref} className={`inline-block min-w-[2ch] text-white ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
