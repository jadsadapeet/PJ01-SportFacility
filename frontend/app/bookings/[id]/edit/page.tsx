"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, errorMessage, type Booking, type Facility } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import RequireAuth from "@/components/RequireAuth";
import BookingForm from "@/components/BookingForm";
import { isPast } from "@/components/BookingTable";
import { ErrorBanner, Loading, PageHeader } from "@/components/ui";

// 07 Edit Booking (owner) and A2 Edit Any Booking (admin).
export default function EditBookingPage() {
  return (
    <RequireAuth>
      <EditBooking />
    </RequireAuth>
  );
}

function EditBooking() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [facilities, setFacilities] = useState<Facility[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api<Booking>(`/bookings/${id}`), api<Facility[]>("/facilities")])
      .then(([b, fs]) => {
        setBooking(b);
        // Keep the current facility selectable even if it was deactivated.
        setFacilities(b.facility && !fs.some((f) => f._id === b.facility!._id) ? [b.facility, ...fs] : fs);
      })
      .catch((e) => setError(errorMessage(e)));
  }, [id]);

  const returnTo = user?.role === "admin" ? "/admin/bookings" : "/bookings";

  return (
    <>
      <PageHeader title="Edit booking" subtitle={booking ? `Booking #${booking._id.slice(-6).toUpperCase()}` : undefined} />
      {error && <ErrorBanner title="Cannot open booking" message={error} />}
      {!booking && !error && <Loading />}
      {booking && isPast(booking) && (
        <ErrorBanner title="This booking has finished" message="Past bookings cannot be edited." />
      )}
      {booking && !isPast(booking) && booking.facility && booking.user && facilities && (
        <BookingForm
          mode="edit"
          facility={booking.facility}
          facilities={facilities}
          booking={booking}
          owner={booking.user}
          returnTo={returnTo}
        />
      )}
    </>
  );
}
