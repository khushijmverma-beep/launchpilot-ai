type LogoProps = {
  className?: string;
  size?: number;
  variant?: "mark" | "full";
};

export function Logo({ className = "", size = 32, variant = "full" }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden={variant === "mark"}
      role={variant === "full" ? "img" : undefined}
    >
      <title>{variant === "full" ? "LaunchPilot AI" : undefined}</title>
      {/* Abstract launch trajectory: nose cone + ascending path */}
      <path
        d="M16 4 L22 14 L18 14 L20 26 L16 22 L12 26 L14 14 L10 14 Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="16" cy="8" r="1.5" fill="currentColor" />
      <path
        d="M8 28 C10 24 13 22 16 22 C19 22 22 24 24 28"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}
