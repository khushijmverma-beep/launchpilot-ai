"use client";

import { getInitials } from "@/lib/users/format";

type UserAvatarProps = {
  name: string;
  avatarUrl?: string | null;
  size?: "md" | "sm";
  onClick?: () => void;
  className?: string;
};

export function UserAvatar({ name, avatarUrl, size = "md", onClick, className = "" }: UserAvatarProps) {
  const sizeClass = size === "sm" ? "profile-avatar--sm" : "";
  const clickable = onClick ? "profile-avatar--clickable" : "";

  const content = avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
  ) : (
    getInitials(name)
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`profile-avatar ${sizeClass} ${clickable} ${className}`}
        aria-label="Open profile menu"
      >
        {content}
      </button>
    );
  }

  return <div className={`profile-avatar ${sizeClass} ${className}`}>{content}</div>;
}
