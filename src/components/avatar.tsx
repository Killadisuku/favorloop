import type { ProfilePublic } from "@/lib/types";

export function Avatar({
  user,
  size = "md",
}: {
  user: Pick<ProfilePublic, "name" | "photoUrl" | "avatarHue">;
  size?: "sm" | "md" | "lg";
}) {
  const cls = `avatar ${size === "lg" ? "lg" : size === "sm" ? "sm" : ""}`;
  const initial = (user.name || "?").charAt(0).toUpperCase();
  if (user.photoUrl) {
    return <img className={cls} src={user.photoUrl} alt="" style={{ background: `hsl(${user.avatarHue} 35% 42%)` }} />;
  }
  return (
    <span className={cls} style={{ background: `hsl(${user.avatarHue} 35% 42%)` }}>
      {initial}
    </span>
  );
}
