// Unit tests for the pure booking rules (no database).
// Run: npm test
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { getLocalNow, parseBookingInput, rangesOverlap } = require("../utils/bookingRules");

// Fixed "now": 6 Nov 2026, 14:00 in Bangkok.
const NOW = { date: "2026-11-06", minutes: 14 * 60 };
const parse = (input) => parseBookingInput(input, NOW);
const valid = { bookingDate: "2026-11-07", startTime: "10:00", durationHours: 1.5 };

describe("getLocalNow", () => {
  it("uses Bangkok time, not UTC", () => {
    // 2026-11-06 20:30 UTC is already 2026-11-07 03:30 in Bangkok (UTC+7).
    const now = getLocalNow(new Date("2026-11-06T20:30:00Z"), "Asia/Bangkok");
    assert.deepEqual(now, { date: "2026-11-07", minutes: 3 * 60 + 30 });
  });

  it("returns midnight as 0 minutes", () => {
    const now = getLocalNow(new Date("2026-11-06T17:00:00Z"), "Asia/Bangkok");
    assert.deepEqual(now, { date: "2026-11-07", minutes: 0 });
  });
});

describe("parseBookingInput – valid bookings", () => {
  it("computes start/end minutes and the UTC-midnight date", () => {
    const r = parse(valid);
    assert.equal(r.error, undefined);
    assert.equal(r.startMinutes, 600);
    assert.equal(r.endMinutes, 690);
    assert.equal(r.duration, 1.5);
    assert.equal(r.date.toISOString(), "2026-11-07T00:00:00.000Z");
  });

  it("accepts exactly 2 hours (the maximum)", () => {
    assert.equal(parse({ ...valid, durationHours: 2 }).error, undefined);
  });

  it("accepts a duration sent as a string", () => {
    assert.equal(parse({ ...valid, durationHours: "1" }).endMinutes, 660);
  });

  it("accepts a booking that ends exactly at midnight", () => {
    const r = parse({ ...valid, startTime: "22:00", durationHours: 2 });
    assert.equal(r.endMinutes, 1440);
  });

  it("accepts later today", () => {
    assert.equal(parse({ ...valid, bookingDate: NOW.date, startTime: "14:30" }).error, undefined);
  });
});

describe("parseBookingInput – rule violations", () => {
  const cases = [
    ["more than 2 hours", { durationHours: 2.5 }, /at most 2 hours/],
    ["3 hours", { durationHours: 3 }, /at most 2 hours/],
    ["zero duration", { durationHours: 0 }, /greater than 0/],
    ["negative duration", { durationHours: -1 }, /greater than 0/],
    ["missing duration", { durationHours: undefined }, /greater than 0/],
    ["non-numeric duration", { durationHours: "abc" }, /greater than 0/],
    ["a date in the past", { bookingDate: "2026-11-05" }, /cannot be in the past/],
    ["today, time already passed", { bookingDate: NOW.date, startTime: "09:00" }, /already passed/],
    ["today, exactly now", { bookingDate: NOW.date, startTime: "14:00" }, /already passed/],
    ["ending after midnight", { startTime: "23:00", durationHours: 1.5 }, /same day/],
    ["missing date", { bookingDate: "" }, /required/],
    ["missing start time", { startTime: "" }, /required/],
    ["start time not HH:mm", { startTime: "9:00" }, /required/],
    ["start time 24:00", { startTime: "24:00" }, /required/],
    ["malformed date", { bookingDate: "07/11/2026" }, /Invalid booking date/],
    ["impossible date", { bookingDate: "2026-02-31" }, /Invalid booking date/],
  ];

  for (const [name, change, expected] of cases) {
    it(`rejects ${name}`, () => {
      const r = parse({ ...valid, ...change });
      assert.match(r.error ?? "(no error)", expected);
    });
  }
});

describe("rangesOverlap", () => {
  const r = (s, e) => ({ startMinutes: s, endMinutes: e });

  it("detects partial overlap", () => assert.equal(rangesOverlap(r(600, 690), r(660, 720)), true));
  it("detects one range inside another", () => assert.equal(rangesOverlap(r(600, 720), r(630, 660)), true));
  it("detects identical ranges", () => assert.equal(rangesOverlap(r(600, 660), r(600, 660)), true));
  it("allows back-to-back ranges", () => assert.equal(rangesOverlap(r(600, 660), r(660, 720)), false));
  it("allows separate ranges", () => assert.equal(rangesOverlap(r(600, 660), r(800, 860)), false));
});
