"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, errorMessage, type Facility } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import RequireAuth from "@/components/RequireAuth";
import BookingForm from "@/components/BookingForm";
import { ErrorBanner, Loading, PageHeader } from "@/components/ui";

// 05 Create Booking (member only).
export default function CreateBookingPage() {
  return (
    <RequireAuth role="member">
      <CreateBooking />
    </RequireAuth>
  );
}

function CreateBooking() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Facility>(`/facilities/${id}`)
      .then(setFacility)
      .catch((e) => setError(errorMessage(e)));
  }, [id]);

  return (
    <>
      <PageHeader title="New booking" subtitle="Choose date, start time and duration" />
      {error && <ErrorBanner title="Facility not available" message={error} />}
      {!facility && !error && <Loading />}
      {facility && user && <BookingForm mode="create" facility={facility} owner={user} returnTo="/bookings" />}
    </>
  );
}
