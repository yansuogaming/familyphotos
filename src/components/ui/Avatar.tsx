/* eslint-disable @next/next/no-img-element -- avatars may be local data URLs */
import type { User } from "@/lib/api/types";

const sizes = { sm: "size-8 text-xs", md: "size-11 text-sm", lg: "size-24 text-3xl" } as const;

export const initials = (name: string) =>
  name.split(" ").filter(Boolean).slice(-2).map((w) => w[0]).join("").toUpperCase();

export function Avatar({ user, size = "md", className = "" }: { user: Pick<User, "name" | "avatarUrl">; size?: keyof typeof sizes; className?: string }) {
  return user.avatarUrl ? (
    <img src={user.avatarUrl} alt="" className={`${sizes[size]} shrink-0 rounded-full object-cover ${className}`} />
  ) : (
    <span aria-hidden="true" className={`${sizes[size]} flex shrink-0 items-center justify-center rounded-full bg-coral-wash font-display font-semibold text-coral-ink ${className}`}>
      {initials(user.name)}
    </span>
  );
}
