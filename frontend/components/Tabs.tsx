"use client";

// Upcoming / Past switcher above booking tables.
export default function Tabs({
  tab,
  setTab,
  upcoming,
  past,
}: {
  tab: "upcoming" | "past";
  setTab: (t: "upcoming" | "past") => void;
  upcoming: number;
  past: number;
}) {
  const btn = (t: "upcoming" | "past", label: string, n: number) => (
    <button
      onClick={() => setTab(t)}
      className={`chip transition ${tab === t ? "chip-lime" : "bg-transparent text-muted hover:bg-surface-2"}`}
    >
      {label} ({n})
    </button>
  );
  return (
    <div className="mb-4 flex gap-1.5">
      {btn("upcoming", "Upcoming", upcoming)}
      {btn("past", "Past", past)}
    </div>
  );
}
