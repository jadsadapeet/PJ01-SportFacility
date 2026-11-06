"use client";

import { CLOSE_HOUR, OPEN_HOUR, fromMinutes } from "@/lib/time";

export interface Range {
  startMinutes: number;
  endMinutes: number;
}

type SlotState = "free" | "booked" | "mine" | "past" | "selected" | "clash";

const overlaps = (a: Range, b: Range) => a.startMinutes < b.endMinutes && a.endMinutes > b.startMinutes;

const styles: Record<SlotState, string> = {
  free: "bg-white hover:bg-neutral-200 cursor-pointer",
  booked: "bg-neutral-700 cursor-not-allowed",
  mine: "bg-[repeating-linear-gradient(45deg,#525252_0_3px,#e5e5e5_3px_7px)] cursor-not-allowed",
  past: "bg-neutral-100 cursor-not-allowed",
  selected: "bg-neutral-400",
  clash: "bg-neutral-900 ring-2 ring-inset ring-white",
};

// Day timeline in 30-minute cells. Click a free cell to choose a start time.
export default function AvailabilityBar({
  booked,
  mine,
  pastUntil,
  selection,
  onPick,
  mineLabel = "Your other booking",
}: {
  booked: Range[]; // other people's bookings of this facility
  mine: Range[]; // the member's own bookings at other facilities
  pastUntil: number | null; // minutes already passed today, or null
  selection: Range | null;
  onPick: (startTime: string) => void;
  mineLabel?: string;
}) {
  const cells: { start: number; state: SlotState }[] = [];
  for (let m = OPEN_HOUR * 60; m < CLOSE_HOUR * 60; m += 30) {
    const cell = { startMinutes: m, endMinutes: m + 30 };
    const isBooked = booked.some((b) => overlaps(b, cell));
    const isMine = mine.some((b) => overlaps(b, cell));
    const isSelected = !!selection && overlaps(selection, cell);
    let state: SlotState = "free";
    if (pastUntil !== null && m <= pastUntil) state = "past";
    else if (isSelected && (isBooked || isMine)) state = "clash";
    else if (isSelected) state = "selected";
    else if (isBooked) state = "booked";
    else if (isMine) state = "mine";
    cells.push({ start: m, state });
  }

  const hours: number[] = [];
  for (let h = OPEN_HOUR; h <= CLOSE_HOUR; h += 3) hours.push(h);

  return (
    <div>
      <div className="flex overflow-hidden rounded-md border border-neutral-300">
        {cells.map((c) => (
          <button
            key={c.start}
            type="button"
            title={`${fromMinutes(c.start)} – ${fromMinutes(c.start + 30)} · ${c.state === "mine" ? mineLabel.toLowerCase() : label[c.state]}`}
            disabled={c.state === "booked" || c.state === "mine" || c.state === "past"}
            onClick={() => onPick(fromMinutes(c.start))}
            className={`h-10 flex-1 border-r border-neutral-200 last:border-r-0 ${styles[c.state]}`}
          />
        ))}
      </div>
      <div className="relative mt-1 h-4 text-[10px] text-neutral-500">
        {hours.map((h) => (
          <span
            key={h}
            className="absolute -translate-x-1/2"
            style={{ left: `${((h - OPEN_HOUR) / (CLOSE_HOUR - OPEN_HOUR)) * 100}%` }}
          >
            {String(h).padStart(2, "0")}:00
          </span>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-600">
        <Legend cls={styles.free}>Available</Legend>
        <Legend cls={styles.booked}>Booked</Legend>
        <Legend cls={styles.mine}>{mineLabel}</Legend>
        <Legend cls={styles.selected}>Selected time</Legend>
        <Legend cls={styles.clash}>Overlap</Legend>
      </div>
    </div>
  );
}

const label: Record<SlotState, string> = {
  free: "available",
  booked: "booked",
  mine: "your other booking",
  past: "passed",
  selected: "selected time",
  clash: "overlap",
};

function Legend({ cls, children }: { cls: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-3 w-3 rounded-sm border border-neutral-300 ${cls}`} />
      {children}
    </span>
  );
}
