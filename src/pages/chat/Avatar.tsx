import { resolveProfileImageUrl } from "../../utils/mediaUrl";

export function Avatar({
  name,
  image,
  online,
  size = "md",
  shape = "circle",
}: {
  name: string;
  image: string | null;
  online?: boolean;
  size?: "sm" | "md" | "lg";
  shape?: "circle" | "rounded";
}) {
  const url = resolveProfileImageUrl(image);
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const dim = size === "lg" ? "h-12 w-12" : size === "md" ? "h-10 w-10" : "h-8 w-8";
  const textSize = size === "lg" ? "text-base" : size === "md" ? "text-sm" : "text-xs";
  const rounding = shape === "rounded" ? "rounded-xl" : "rounded-full";

  return (
    <div className="relative shrink-0">
      <div
        className={`${dim} ${rounding} flex items-center justify-center bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-semibold ${textSize} overflow-hidden ring-2 ring-white shadow-sm`}
      >
        {url ? (
          <img src={url} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span className="select-none">{initials}</span>
        )}
      </div>
      {online !== undefined && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${
            online ? "bg-emerald-500" : "bg-gray-300"
          }`}
        />
      )}
    </div>
  );
}
