"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, errorMessage, type Booking } from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";
import BookingTable, { isPast } from "@/components/BookingTable";
import { ErrorBanner, FlashMessage, Loading, PageHeader } from "@/components/ui";
import Tabs from "@/components/Tabs";

// 06 My Bookings + 08 Delete (member sees only own bookings).
export default function MyBookingsPage() {
  return (
    <RequireAuth role="member">
      <MyBookings />
    </RequireAuth>
  );
}

function MyBookings() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  useEffect(() => {
    api<Booking[]>("/bookings")
      .then(setBookings)
      .catch((e) => setError(errorMessage(e)));
  }, []);

  const upcoming = (bookings ?? []).filter((b) => !isPast(b));
  const past = (bookings ?? []).filter(isPast).reverse();

  return (
    <>
      <FlashMessage />
      <PageHeader
        title="My Bookings"
        subtitle="Bookings you have made"
        action={<Link href="/" className="btn-primary">+ New booking</Link>}
      />
      {error && <ErrorBanner message={error} />}
      {!bookings && !error && <Loading />}
      {bookings && (
        <>
          <Tabs tab={tab} setTab={setTab} upcoming={upcoming.length} past={past.length} />
          <BookingTable
            bookings={tab === "upcoming" ? upcoming : past}
            onDeleted={(id) => setBookings((list) => (list ?? []).filter((b) => b._id !== id))}
            emptyText={
              tab === "upcoming" ? (
                <>No upcoming bookings. <Link href="/" className="link">Find a facility</Link></>
              ) : (
                "No past bookings."
              )
            }
          />
        </>
      )}
    </>
  );
}
