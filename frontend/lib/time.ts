// Date/time helpers. All "today/now" checks use Thailand time, same as the backend.

export const TIME_ZONE = "Asia/Bangkok";

// Facilities are bookable from OPEN_HOUR to CLOSE_HOUR, in 30-minute steps.
export const OPEN_HOUR = 6;
export const CLOSE_HOUR = 24;
export const MAX_HOURS = 2;
export const MIN_HOURS = 0.5;

export function localNow(at: Date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(at)
      .map((p) => [p.type, p.value])
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export const fromMinutes = (mins: number) =>
  `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;

// Every 30-minute start time within opening hours.
export const startTimeOptions = () => {
  const list: string[] = [];
  for (let m = OPEN_HOUR * 60; m < CLOSE_HOUR * 60; m += 30) list.push(fromMinutes(m));
  return list;
};

// bookingDate from the API is midnight UTC; show it as a calendar date.
export const isoDate = (iso: string) => iso.slice(0, 10);

export const formatDate = (iso: string) =>
  new Date(`${isoDate(iso)}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

export const formatRange = (startMinutes: number, endMinutes: number) =>
  `${fromMinutes(startMinutes)} – ${fromMinutes(endMinutes)}`;

export const formatHours = (h: number) => `${h} h`;

export const formatBaht = (n: number) => `${n.toLocaleString("en-US")} THB`;

export interface BookingDraft {
  bookingDate: string;
  startTime: string;
  durationHours: string;
}

// Client-side check that mirrors the backend rules, so all problems show at once.
export function validateBooking(d: BookingDraft, now = localNow()) {
  const errors: Partial<Record<keyof BookingDraft, string>> = {};
  const duration = Number(d.durationHours);

  if (!d.bookingDate) errors.bookingDate = "Please choose a date";
  else if (d.bookingDate < now.date) errors.bookingDate = "Booking date cannot be in the past";

  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(d.startTime)) errors.startTime = "Please choose a start time";

  if (!d.durationHours || !Number.isFinite(duration)) errors.durationHours = "Please enter a duration";
  else if (duration > MAX_HOURS) errors.durationHours = "Max 2 hours per booking";
  else if (duration < MIN_HOURS) errors.durationHours = "Minimum 0.5 hours per booking";
  else if ((duration * 60) % 30 !== 0) errors.durationHours = "Use steps of 0.5 hours";

  if (!errors.startTime && !errors.durationHours) {
    const start = toMinutes(d.startTime);
    if (start + duration * 60 > CLOSE_HOUR * 60) errors.durationHours = "Booking must end by midnight";
    if (!errors.bookingDate && d.bookingDate === now.date && start <= now.minutes) {
      errors.startTime = "This time has already passed";
    }
  }
  return errors;
}
