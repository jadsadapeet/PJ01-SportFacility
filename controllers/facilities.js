const Facility = require("../models/Facility");
const Booking = require("../models/Booking");

exports.getFacilities = async (req, res, next) => {
  try {
    const facilities = await Facility.find({ isActive: true }).sort({ name: 1 });
    res.status(200).json({ success: true, count: facilities.length, data: facilities });
  } catch (error) {
    next(error);
  }
};

exports.getFacility = async (req, res, next) => {
  try {
    const facility = await Facility.findOne({ _id: req.params.id, isActive: true });
    if (!facility) return res.status(404).json({ success: false, error: "Facility not found" });
    res.status(200).json({ success: true, data: facility });
  } catch (error) {
    next(error);
  }
};

// Deleted facilities keep their row (soft delete), so the unique name index would
// still block that name. Rename a deleted holder so the name can be reused.
const freeNameFromDeleted = async (name) => {
  if (typeof name !== "string" || !name.trim()) return;
  const old = await Facility.findOne({ name: name.trim(), isActive: false });
  if (old) await Facility.updateOne({ _id: old._id }, { name: `${old.name} [deleted ${old._id}]` });
};

exports.createFacility = async (req, res, next) => {
  try {
    await freeNameFromDeleted(req.body.name);
    const facility = await Facility.create(req.body);
    res.status(201).json({ success: true, data: facility });
  } catch (error) {
    next(error);
  }
};

exports.updateFacility = async (req, res, next) => {
  try {
    await freeNameFromDeleted(req.body.name);
    const facility = await Facility.findOneAndUpdate(
      { _id: req.params.id, isActive: true },
      req.body,
      { new: true, runValidators: true }
    );
    if (!facility) return res.status(404).json({ success: false, error: "Facility not found" });
    res.status(200).json({ success: true, data: facility });
  } catch (error) {
    next(error);
  }
};

exports.deleteFacility = async (req, res, next) => {
  try {
    const facility = await Facility.findOneAndUpdate(
      { _id: req.params.id, isActive: true },
      { isActive: false },
      { new: true }
    );
    if (!facility) return res.status(404).json({ success: false, error: "Facility not found" });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

// Public: booked time ranges of one facility on one date (no member details).
exports.getFacilityAvailability = async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ""))) {
      return res.status(400).json({ success: false, error: "date query in YYYY-MM-DD format is required" });
    }
    const facility = await Facility.findOne({ _id: req.params.id, isActive: true });
    if (!facility) return res.status(404).json({ success: false, error: "Facility not found" });

    const bookings = await Booking.find({ facility: facility.id, bookingDate: new Date(`${date}T00:00:00.000Z`) })
      .select("startTime startMinutes endMinutes")
      .sort({ startMinutes: 1 });
    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings.map((b) => ({ id: b.id, startTime: b.startTime, startMinutes: b.startMinutes, endMinutes: b.endMinutes })),
    });
  } catch (error) {
    next(error);
  }
};
