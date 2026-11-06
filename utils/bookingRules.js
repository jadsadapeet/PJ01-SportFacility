// Pure booking-rule helpers (no database), shared by the controller and unit tests.

const TIME_ZONE = process.env.TZ_NAME || "Asia/Bangkok";
const MAX_DURATION_HOURS = 2;

// Date (YYYY-MM-DD) and minutes since midnight of `at` in the given time zone.
const getLocalNow = (at = new Date(), timeZone = TIME_ZONE) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(at).map((p) => [p.type, p.value])
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
};

// Validates booking input. Returns { error } or { date, startMinutes, endMinutes, duration }.
// `now` is injectable so the rules can be tested at a fixed time.
const parseBookingInput = ({ bookingDate, startTime, durationHours }, now = getLocalNow()) => {
  if (!bookingDate || !/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime || "")) {
    return { error: "bookingDate and startTime in HH:mm format are required" };
  }
  const duration = Number(durationHours);
  if (!Number.isFinite(duration) || duration <= 0 || duration > MAX_DURATION_HOURS) {
    return { error: "Booking duration must be greater than 0 and at most 2 hours" };
  }

  // Reject malformed and impossible dates such as 2026-02-31.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(bookingDate))) return { error: "Invalid booking date" };
  const date = new Date(`${bookingDate}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== bookingDate) {
    return { error: "Invalid booking date" };
  }

  // "Today" and "now" follow the facility's local time zone, not UTC.
  if (bookingDate < now.date) return { error: "Booking date cannot be in the past" };

  const [hours, minutes] = startTime.split(":").map(Number);
  const startMinutes = hours * 60 + minutes;
  const endMinutes = startMinutes + duration * 60;
  if (endMinutes > 1440) return { error: "Booking must end on the same day" };
  if (bookingDate === now.date && startMinutes <= now.minutes) {
    return { error: "Start time has already passed" };
  }

  return { date, startMinutes, endMinutes, duration };
};

// Two half-open ranges [start, end) overlap; touching ends do not.
const rangesOverlap = (a, b) => a.startMinutes < b.endMinutes && a.endMinutes > b.startMinutes;

module.exports = { TIME_ZONE, MAX_DURATION_HOURS, getLocalNow, parseBookingInput, rangesOverlap };
