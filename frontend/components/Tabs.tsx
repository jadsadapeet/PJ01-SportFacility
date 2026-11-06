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
      className={`border-b-2 px-4 py-2 text-sm ${tab === t ? "border-neutral-900 font-semibold" : "border-transparent text-neutral-500"}`}
    >
      {label} ({n})
    </button>
  );
  return (
    <div className="mb-4 flex border-b border-neutral-200">
      {btn("upcoming", "Upcoming", upcoming)}
      {btn("past", "Past", past)}
    </div>
  );
}
