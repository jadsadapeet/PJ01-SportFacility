const Booking = require("../models/Booking");
const Facility = require("../models/Facility");

const { parseBookingInput } = require("../utils/bookingRules");

const findConflict = async ({ facility, user, date, startMinutes, endMinutes, excludeId }) => {
  const baseQuery = {
    bookingDate: date,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    $or: [
      { facility, startMinutes: { $lt: endMinutes }, endMinutes: { $gt: startMinutes } },
      { user, startMinutes: { $lt: endMinutes }, endMinutes: { $gt: startMinutes } },
    ],
  };
  return Booking.findOne(baseQuery);
};

const populateBooking = (query) => query
  .populate("facility", "name sportType location capacity hourlyRate")
  .populate("user", "name email tel role");

exports.getBookings = async (req, res, next) => {
  try {
    const filter = req.user.role === "admin" ? {} : { user: req.user.id };
    const bookings = await populateBooking(Booking.find(filter).sort({ bookingDate: 1, startMinutes: 1 }));
    res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    next(error);
  }
};

exports.getBooking = async (req, res, next) => {
  try {
    const booking = await populateBooking(Booking.findById(req.params.id));
    if (!booking) return res.status(404).json({ success: false, error: "Booking not found" });
    if (req.user.role !== "admin" && booking.user._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: "Not authorized to view this booking" });
    }
    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

exports.createBooking = async (req, res, next) => {
  try {
    const parsed = parseBookingInput(req.body);
    if (parsed.error) return res.status(400).json({ success: false, error: parsed.error });

    const facility = await Facility.findOne({ _id: req.body.facility, isActive: true });
    if (!facility) return res.status(404).json({ success: false, error: "Facility not found or inactive" });

    const conflict = await findConflict({
      facility: facility.id,
      user: req.user.id,
      date: parsed.date,
      startMinutes: parsed.startMinutes,
      endMinutes: parsed.endMinutes,
    });
    if (conflict) return res.status(409).json({ success: false, error: "Facility or member already has an overlapping booking" });

    const booking = await Booking.create({
      facility: facility.id,
      user: req.user.id,
      bookingDate: parsed.date,
      startTime: req.body.startTime,
      durationHours: parsed.duration,
      startMinutes: parsed.startMinutes,
      endMinutes: parsed.endMinutes,
    });
    res.status(201).json({ success: true, data: await populateBooking(Booking.findById(booking.id)) });
  } catch (error) {
    next(error);
  }
};

exports.updateBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, error: "Booking not found" });
    if (req.user.role !== "admin" && booking.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: "Not authorized to edit this booking" });
    }

    const values = {
      bookingDate: req.body.bookingDate || booking.bookingDate.toISOString().slice(0, 10),
      startTime: req.body.startTime || booking.startTime,
      durationHours: req.body.durationHours ?? booking.durationHours,
    };
    const parsed = parseBookingInput(values);
    if (parsed.error) return res.status(400).json({ success: false, error: parsed.error });

    const facilityId = req.body.facility || booking.facility;
    const facility = await Facility.findOne({ _id: facilityId, isActive: true });
    if (!facility) return res.status(404).json({ success: false, error: "Facility not found or inactive" });
    const conflict = await findConflict({
      facility: facility.id,
      user: booking.user,
      date: parsed.date,
      startMinutes: parsed.startMinutes,
      endMinutes: parsed.endMinutes,
      excludeId: booking.id,
    });
    if (conflict) return res.status(409).json({ success: false, error: "Facility or member already has an overlapping booking" });

    const updated = await Booking.findByIdAndUpdate(req.params.id, {
      facility: facility.id,
      bookingDate: parsed.date,
      startTime: values.startTime,
      durationHours: parsed.duration,
      startMinutes: parsed.startMinutes,
      endMinutes: parsed.endMinutes,
    }, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: await populateBooking(Booking.findById(updated.id)) });
  } catch (error) {
    next(error);
  }
};

exports.deleteBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, error: "Booking not found" });
    if (req.user.role !== "admin" && booking.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: "Not authorized to delete this booking" });
    }
    await booking.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
