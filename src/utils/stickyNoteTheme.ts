export const STICKY_COLOR_IDS = [
  "lemon",
  "mint",
  "sky",
  "lilac",
  "peach",
  "paper",
] as const;

export type StickyColorId = (typeof STICKY_COLOR_IDS)[number];

export const STICKY_COLOR_OPTIONS: {
  id: StickyColorId;
  label: string;
  /** Card gradient + border + text */
  card: string;
  swatch: string;
}[] = [
  {
    id: "lemon",
    label: "Lemon",
    card: "from-amber-100 to-yellow-50 border-amber-300/90 text-amber-950",
    swatch: "bg-amber-300 ring-amber-500/40",
  },
  {
    id: "mint",
    label: "Mint",
    card: "from-emerald-100 to-lime-50 border-emerald-300/90 text-emerald-950",
    swatch: "bg-emerald-300 ring-emerald-500/40",
  },
  {
    id: "sky",
    label: "Sky",
    card: "from-sky-100 to-cyan-50 border-sky-300/90 text-sky-950",
    swatch: "bg-sky-300 ring-sky-500/40",
  },
  {
    id: "lilac",
    label: "Lilac",
    card: "from-violet-100 to-fuchsia-50 border-violet-300/90 text-violet-950",
    swatch: "bg-violet-300 ring-violet-500/40",
  },
  {
    id: "peach",
    label: "Peach",
    card: "from-orange-100 to-rose-50 border-orange-300/90 text-orange-950",
    swatch: "bg-orange-300 ring-orange-500/40",
  },
  {
    id: "paper",
    label: "Paper",
    card: "from-stone-50 to-amber-50/80 border-stone-300/90 text-stone-900",
    swatch: "bg-stone-200 ring-stone-400/50",
  },
];

export function stickyCardClasses(color?: string | null): string {
  const id = (color as StickyColorId) || "lemon";
  const opt = STICKY_COLOR_OPTIONS.find((o) => o.id === id);
  return opt?.card ?? STICKY_COLOR_OPTIONS[0].card;
}
