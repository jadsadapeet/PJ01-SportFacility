// API tests: real Express app + throwaway in-memory MongoDB.
// Never touches the database in config/config.env.
// Run: npm test
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";
process.env.JWT_EXPIRE = "1h";
process.env.JWT_COOKIE_EXPIRE = "1";

const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { app } = require("../server");
const User = require("../models/User");
const Booking = require("../models/Booking");
const { getLocalNow } = require("../utils/bookingRules");

const API = "/api/v1";
const today = getLocalNow().date;
const dayOffset = (n) => {
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const TOMORROW = dayOffset(1);

let mongo;
let adminToken, memberToken, otherToken, memberId;
let courtA, courtB;

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const book = (token, body) => request(app).post(`${API}/bookings`).set(auth(token)).send(body);

before(async () => {
  // Silence the error handler's stack traces for expected 4xx/5xx responses.
  console.error = () => {};
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());

  await User.create({ name: "Admin", email: "admin@test.com", tel: "0811111111", password: "123456", role: "admin" });
  adminToken = (await request(app).post(`${API}/auth/login`).send({ email: "admin@test.com", password: "123456" })).body.data.token;

  const m = await request(app).post(`${API}/auth/register`).send({ name: "Somchai", email: "somchai@test.com", tel: "0812345678", password: "123456" });
  memberToken = m.body.data.token;
  memberId = m.body.data.id;
  otherToken = (await request(app).post(`${API}/auth/register`).send({ name: "Malee", email: "malee@test.com", tel: "0823456789", password: "123456" })).body.data.token;

  const facility = (name) => ({ name, sportType: "Badminton", location: "Floor 1", capacity: 4, hourlyRate: 200 });
  courtA = (await request(app).post(`${API}/facilities`).set(auth(adminToken)).send(facility("Court A"))).body.data._id;
  courtB = (await request(app).post(`${API}/facilities`).set(auth(adminToken)).send(facility("Court B"))).body.data._id;
});

after(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});

describe("Auth", () => {
  it("register always creates a member, even if role=admin is sent", async () => {
    const res = await request(app).post(`${API}/auth/register`)
      .send({ name: "Sneaky", email: "sneaky@test.com", tel: "0800000000", password: "123456", role: "admin" });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.role, "member");
    assert.ok(res.body.data.token);
  });

  it("rejects a duplicate email", async () => {
    const res = await request(app).post(`${API}/auth/register`)
      .send({ name: "Dup", email: "somchai@test.com", tel: "0800000000", password: "123456" });
    assert.notEqual(res.status, 201);
    assert.equal(res.body.success, false);
  });

  it("rejects a short password", async () => {
    const res = await request(app).post(`${API}/auth/register`)
      .send({ name: "Short", email: "short@test.com", tel: "0800000000", password: "123" });
    assert.notEqual(res.status, 201);
  });

  it("rejects a wrong password with 401", async () => {
    const res = await request(app).post(`${API}/auth/login`).send({ email: "somchai@test.com", password: "wrong" });
    assert.equal(res.status, 401);
  });

  it("GET /auth/me returns the logged-in user without the password", async () => {
    const res = await request(app).get(`${API}/auth/me`).set(auth(memberToken));
    assert.equal(res.status, 200);
    assert.equal(res.body.data.email, "somchai@test.com");
    assert.equal(res.body.data.password, undefined);
  });

  it("protected routes need a bearer token", async () => {
    assert.equal((await request(app).get(`${API}/auth/me`)).status, 401);
    assert.equal((await request(app).get(`${API}/bookings`)).status, 401);
    assert.equal((await request(app).get(`${API}/auth/me`).set(auth("not-a-token"))).status, 401);
  });
});

describe("Facilities", () => {
  it("anyone can list facilities", async () => {
    const res = await request(app).get(`${API}/facilities`);
    assert.equal(res.status, 200);
    assert.ok(res.body.count >= 2);
  });

  it("a member cannot create, edit or delete a facility (403)", async () => {
    const body = { name: "X", sportType: "X", location: "X", capacity: 1, hourlyRate: 1 };
    assert.equal((await request(app).post(`${API}/facilities`).set(auth(memberToken)).send(body)).status, 403);
    assert.equal((await request(app).put(`${API}/facilities/${courtA}`).set(auth(memberToken)).send({ capacity: 9 })).status, 403);
    assert.equal((await request(app).delete(`${API}/facilities/${courtA}`).set(auth(memberToken))).status, 403);
  });

  it("admin can edit a facility", async () => {
    const res = await request(app).put(`${API}/facilities/${courtB}`).set(auth(adminToken)).send({ hourlyRate: 250 });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.hourlyRate, 250);
  });

  it("rejects invalid capacity", async () => {
    const res = await request(app).post(`${API}/facilities`).set(auth(adminToken))
      .send({ name: "Bad", sportType: "X", location: "X", capacity: 0, hourlyRate: 1 });
    assert.notEqual(res.status, 201);
  });

  it("admin delete hides the facility (soft delete) and it can no longer be booked", async () => {
    const created = await request(app).post(`${API}/facilities`).set(auth(adminToken))
      .send({ name: "Temp Gym", sportType: "Fitness", location: "Floor 3", capacity: 10, hourlyRate: 100 });
    const id = created.body.data._id;
    assert.equal((await request(app).delete(`${API}/facilities/${id}`).set(auth(adminToken))).status, 200);
    assert.equal((await request(app).get(`${API}/facilities/${id}`)).status, 404);
    const res = await book(memberToken, { facility: id, bookingDate: TOMORROW, startTime: "10:00", durationHours: 1 });
    assert.equal(res.status, 404);
  });
});

describe("Bookings – rules", () => {
  beforeEach(async () => {
    await Booking.deleteMany({});
  });

  it("member creates a valid booking (201)", async () => {
    const res = await book(memberToken, { facility: courtA, bookingDate: TOMORROW, startTime: "10:00", durationHours: 1.5 });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.startMinutes, 600);
    assert.equal(res.body.data.endMinutes, 690);
    assert.equal(res.body.data.facility.name, "Court A");
  });

  it("admin cannot create a booking (403)", async () => {
    const res = await book(adminToken, { facility: courtA, bookingDate: TOMORROW, startTime: "10:00", durationHours: 1 });
    assert.equal(res.status, 403);
  });

  it("400: date in the past", async () => {
    const res = await book(memberToken, { facility: courtA, bookingDate: dayOffset(-1), startTime: "10:00", durationHours: 1 });
    assert.equal(res.status, 400);
    assert.match(res.body.error, /past/);
  });

  it("400: more than 2 hours", async () => {
    const res = await book(memberToken, { facility: courtA, bookingDate: TOMORROW, startTime: "10:00", durationHours: 3 });
    assert.equal(res.status, 400);
    assert.match(res.body.error, /2 hours/);
  });

  it("409: facility already booked by someone else at that time", async () => {
    await book(otherToken, { facility: courtA, bookingDate: TOMORROW, startTime: "10:00", durationHours: 2 });
    const res = await book(memberToken, { facility: courtA, bookingDate: TOMORROW, startTime: "11:00", durationHours: 1 });
    assert.equal(res.status, 409);
  });

  it("409: member already has a booking at that time (other facility)", async () => {
    await book(memberToken, { facility: courtA, bookingDate: TOMORROW, startTime: "10:00", durationHours: 1 });
    const res = await book(memberToken, { facility: courtB, bookingDate: TOMORROW, startTime: "10:30", durationHours: 1 });
    assert.equal(res.status, 409);
  });

  it("allows back-to-back bookings", async () => {
    await book(otherToken, { facility: courtA, bookingDate: TOMORROW, startTime: "10:00", durationHours: 1 });
    const res = await book(memberToken, { facility: courtA, bookingDate: TOMORROW, startTime: "11:00", durationHours: 1 });
    assert.equal(res.status, 201);
  });

  it("allows the same time on a different day", async () => {
    await book(otherToken, { facility: courtA, bookingDate: TOMORROW, startTime: "10:00", durationHours: 1 });
    const res = await book(memberToken, { facility: courtA, bookingDate: dayOffset(2), startTime: "10:00", durationHours: 1 });
    assert.equal(res.status, 201);
  });

  it("404: unknown facility id", async () => {
    const res = await book(memberToken, { facility: new mongoose.Types.ObjectId().toString(), bookingDate: TOMORROW, startTime: "10:00", durationHours: 1 });
    assert.equal(res.status, 404);
  });
});

describe("Bookings – ownership", () => {
  let mine, theirs;

  before(async () => {
    await Booking.deleteMany({});
    mine = (await book(memberToken, { facility: courtA, bookingDate: TOMORROW, startTime: "08:00", durationHours: 1 })).body.data._id;
    theirs = (await book(otherToken, { facility: courtA, bookingDate: TOMORROW, startTime: "12:00", durationHours: 1 })).body.data._id;
  });

  it("member sees only their own bookings", async () => {
    const res = await request(app).get(`${API}/bookings`).set(auth(memberToken));
    assert.equal(res.status, 200);
    assert.equal(res.body.count, 1);
    assert.equal(res.body.data[0].user._id, memberId);
  });

  it("admin sees all bookings", async () => {
    const res = await request(app).get(`${API}/bookings`).set(auth(adminToken));
    assert.equal(res.body.count, 2);
  });

  it("member cannot view, edit or delete someone else's booking (403)", async () => {
    assert.equal((await request(app).get(`${API}/bookings/${theirs}`).set(auth(memberToken))).status, 403);
    assert.equal((await request(app).put(`${API}/bookings/${theirs}`).set(auth(memberToken)).send({ startTime: "15:00" })).status, 403);
    assert.equal((await request(app).delete(`${API}/bookings/${theirs}`).set(auth(memberToken))).status, 403);
  });

  it("member edits own booking; same rules apply (409 on overlap)", async () => {
    const clash = await request(app).put(`${API}/bookings/${mine}`).set(auth(memberToken)).send({ startTime: "12:30", durationHours: 1 });
    assert.equal(clash.status, 409);
    const ok = await request(app).put(`${API}/bookings/${mine}`).set(auth(memberToken)).send({ startTime: "09:00", durationHours: 2 });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.data.endMinutes, 660);
  });

  it("editing a booking does not clash with itself", async () => {
    const res = await request(app).put(`${API}/bookings/${mine}`).set(auth(memberToken)).send({ durationHours: 1.5 });
    assert.equal(res.status, 200);
  });

  it("400 on edit: more than 2 hours", async () => {
    const res = await request(app).put(`${API}/bookings/${mine}`).set(auth(memberToken)).send({ durationHours: 2.5 });
    assert.equal(res.status, 400);
  });

  it("admin can edit anyone's booking", async () => {
    const res = await request(app).put(`${API}/bookings/${theirs}`).set(auth(adminToken)).send({ startTime: "16:00" });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.user.name, "Malee");
  });

  it("admin can delete anyone's booking; member can delete own", async () => {
    assert.equal((await request(app).delete(`${API}/bookings/${theirs}`).set(auth(adminToken))).status, 200);
    assert.equal((await request(app).delete(`${API}/bookings/${mine}`).set(auth(memberToken))).status, 200);
    assert.equal(await Booking.countDocuments(), 0);
  });
});

describe("Availability", () => {
  before(async () => {
    await Booking.deleteMany({});
    await book(memberToken, { facility: courtA, bookingDate: TOMORROW, startTime: "18:00", durationHours: 1 });
    await book(otherToken, { facility: courtA, bookingDate: TOMORROW, startTime: "10:00", durationHours: 2 });
  });

  it("lists booked ranges sorted by start, without member details", async () => {
    const res = await request(app).get(`${API}/facilities/${courtA}/availability?date=${TOMORROW}`);
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.data.map((b) => [b.startMinutes, b.endMinutes]), [[600, 720], [1080, 1140]]);
    assert.equal(res.body.data[0].user, undefined);
  });

  it("is empty for another facility or day", async () => {
    assert.equal((await request(app).get(`${API}/facilities/${courtB}/availability?date=${TOMORROW}`)).body.count, 0);
    assert.equal((await request(app).get(`${API}/facilities/${courtA}/availability?date=${dayOffset(2)}`)).body.count, 0);
  });

  it("400 without a valid date", async () => {
    assert.equal((await request(app).get(`${API}/facilities/${courtA}/availability`)).status, 400);
    assert.equal((await request(app).get(`${API}/facilities/${courtA}/availability?date=tomorrow`)).status, 400);
  });
});

describe("Rate limiting behind a proxy", () => {
  it("counts each forwarded client IP separately when trust proxy is on", async () => {
    // Load a fresh copy of the app as it would run in production.
    for (const k of Object.keys(require.cache)) {
      if (k.endsWith("server.js") && !k.includes("node_modules")) delete require.cache[k];
    }
    process.env.TRUST_PROXY = "1";
    const { app: proxied } = require("../server");
    delete process.env.TRUST_PROXY;
    assert.equal(proxied.get("trust proxy"), 1);

    // express-rate-limit reports the remaining quota in the RateLimit-Remaining header.
    const limitOf = async (ip) =>
      Number((await request(proxied).get(`${API}/facilities`).set("X-Forwarded-For", ip)).headers["ratelimit-remaining"]);

    const a1 = await limitOf("203.0.113.1");
    const a2 = await limitOf("203.0.113.1");
    const b1 = await limitOf("203.0.113.2");
    assert.equal(a2, a1 - 1, "same client uses up its own quota");
    assert.equal(b1, a1, "a different client has a full quota");
  });
});
