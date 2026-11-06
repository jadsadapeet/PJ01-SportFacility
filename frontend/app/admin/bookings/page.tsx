"use client";

import { useEffect, useMemo, useState } from "react";
import { api, errorMessage, type Booking } from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";
import BookingTable, { isPast } from "@/components/BookingTable";
import Tabs from "@/components/Tabs";
import { ErrorBanner, FlashMessage, Loading, PageHeader } from "@/components/ui";

// A1 All Bookings + A3 Delete Any Booking (admin).
export default function AllBookingsPage() {
  return (
    <RequireAuth role="admin">
      <AllBookings />
    </RequireAuth>
  );
}

function AllBookings() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [facility, setFacility] = useState("");
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  useEffect(() => {
    api<Booking[]>("/bookings")
      .then(setBookings)
      .catch((e) => setError(errorMessage(e)));
  }, []);

  const facilityNames = useMemo(
    () => [...new Set((bookings ?? []).map((b) => b.facility?.name).filter(Boolean) as string[])].sort(),
    [bookings]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (bookings ?? []).filter(
      (b) =>
        (!facility || b.facility?.name === facility) &&
        (!q ||
          b.user?.name.toLowerCase().includes(q) ||
          b.user?.email.toLowerCase().includes(q) ||
          b.facility?.name.toLowerCase().includes(q))
    );
  }, [bookings, query, facility]);

  const upcoming = filtered.filter((b) => !isPast(b));
  const past = filtered.filter(isPast).reverse();

  return (
    <>
      <FlashMessage />
      <PageHeader title="All Bookings" subtitle="Bookings from all members" />

      <div className="card mb-6 grid gap-4 p-4 sm:grid-cols-[1fr_240px]">
        <div>
          <label className="label" htmlFor="q">Search</label>
          <input id="q" className="input" placeholder="Search by member or facility…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="f">Facility</label>
          <select id="f" className="input" value={facility} onChange={(e) => setFacility(e.target.value)}>
            <option value="">All facilities</option>
            {facilityNames.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}
      {!bookings && !error && <Loading />}
      {bookings && (
        <>
          <Tabs tab={tab} setTab={setTab} upcoming={upcoming.length} past={past.length} />
          <BookingTable
            bookings={tab === "upcoming" ? upcoming : past}
            showMember
            onDeleted={(id) => setBookings((list) => (list ?? []).filter((b) => b._id !== id))}
            emptyText={bookings.length === 0 ? "No bookings yet." : "No bookings match your filters."}
          />
        </>
      )}
    </>
  );
}
