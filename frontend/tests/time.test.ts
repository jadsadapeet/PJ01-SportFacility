// Unit tests for the booking form's date/time helpers.
// Run: npm test   (inside frontend/)
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatBaht,
  formatDate,
  formatRange,
  fromMinutes,
  localNow,
  startTimeOptions,
  toMinutes,
  validateBooking,
  type BookingDraft,
} from "../lib/time.ts";

// Fixed "now": 6 Nov 2026, 14:00 in Bangkok.
const NOW = { date: "2026-11-06", minutes: 14 * 60 };
const valid: BookingDraft = { bookingDate: "2026-11-07", startTime: "10:00", durationHours: "1.5" };
const check = (change: Partial<BookingDraft>) => validateBooking({ ...valid, ...change }, NOW);

describe("localNow", () => {
  it("uses Bangkok time, not UTC", () => {
    assert.deepEqual(localNow(new Date("2026-11-06T20:30:00Z")), { date: "2026-11-07", minutes: 210 });
  });
});

describe("time conversion", () => {
  it("converts HH:mm to minutes and back", () => {
    assert.equal(toMinutes("14:30"), 870);
    assert.equal(fromMinutes(870), "14:30");
    assert.equal(fromMinutes(1440), "24:00");
  });

  it("offers 30-minute start times from 06:00 to 23:30", () => {
    const list = startTimeOptions();
    assert.equal(list[0], "06:00");
    assert.equal(list[1], "06:30");
    assert.equal(list.at(-1), "23:30");
    assert.equal(list.length, 36);
  });
});

describe("formatting", () => {
  it("shows the stored UTC-midnight date as the same calendar day", () => {
    assert.equal(formatDate("2026-11-07T00:00:00.000Z"), "7 Nov 2026");
  });

  it("formats a time range and prices", () => {
    assert.equal(formatRange(600, 690), "10:00 – 11:30");
    assert.equal(formatBaht(1500), "1,500 THB");
  });
});

describe("validateBooking", () => {
  it("accepts a valid booking", () => {
    assert.deepEqual(check({}), {});
  });

  it("accepts exactly 2 hours and later today", () => {
    assert.deepEqual(check({ durationHours: "2" }), {});
    assert.deepEqual(check({ bookingDate: NOW.date, startTime: "14:30" }), {});
  });

  it("rejects a past date", () => {
    assert.equal(check({ bookingDate: "2026-11-05" }).bookingDate, "Booking date cannot be in the past");
  });

  it("rejects more than 2 hours", () => {
    assert.equal(check({ durationHours: "3" }).durationHours, "Max 2 hours per booking");
  });

  it("rejects less than 30 minutes and odd steps", () => {
    assert.equal(check({ durationHours: "0.25" }).durationHours, "Minimum 0.5 hours per booking");
    assert.equal(check({ durationHours: "1.2" }).durationHours, "Use steps of 0.5 hours");
  });

  it("rejects an empty or non-numeric duration", () => {
    assert.ok(check({ durationHours: "" }).durationHours);
    assert.ok(check({ durationHours: "abc" }).durationHours);
  });

  it("rejects a start time that has already passed today", () => {
    assert.equal(check({ bookingDate: NOW.date, startTime: "09:00" }).startTime, "This time has already passed");
  });

  it("rejects a booking that runs past midnight", () => {
    assert.equal(check({ startTime: "23:30", durationHours: "1" }).durationHours, "Booking must end by midnight");
  });

  it("requires date and start time", () => {
    const errors = check({ bookingDate: "", startTime: "" });
    assert.ok(errors.bookingDate);
    assert.ok(errors.startTime);
  });

  it("reports several problems at once (demo 05b)", () => {
    const errors = check({ bookingDate: "2026-11-01", durationHours: "3" });
    assert.deepEqual(Object.keys(errors).sort(), ["bookingDate", "durationHours"]);
  });
});
