"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, errorMessage, type BusySlot, type Facility } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatBaht, formatRange, localNow } from "@/lib/time";
import { ErrorBanner, FacilityImage, Loading } from "@/components/ui";

// 04 Facility Detail – anyone can view; only members can book.
export default function FacilityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [today, setToday] = useState<BusySlot[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Facility>(`/facilities/${id}`)
      .then(setFacility)
      .catch((e) => setError(errorMessage(e)));
    api<BusySlot[]>(`/facilities/${id}/availability?date=${localNow().date}`)
      .then(setToday)
      .catch(() => setToday([]));
  }, [id]);

  return (
    <>
      <Link href="/" className="mb-4 inline-block text-sm text-neutral-600 hover:underline">
        &lt; Back to facilities
      </Link>

      {error && <ErrorBanner title="Facility not available" message={error} />}
      {!facility && !error && <Loading />}

      {facility && (
        <div className="card grid overflow-hidden md:grid-cols-2">
          <FacilityImage sportType={facility.sportType} className="h-64 md:h-full" />
          <div className="p-8">
            <h1 className="text-2xl font-bold">{facility.name}</h1>
            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <Info k="Sport type" v={facility.sportType} />
              <Info k="Location" v={facility.location} />
              <Info k="Capacity" v={`${facility.capacity} people`} />
              <Info k="Hourly rate" v={`${formatBaht(facility.hourlyRate)} / hour`} />
            </dl>

            <div className="mt-6 border-t border-neutral-200 pt-4">
              <p className="text-sm font-medium">Booked today</p>
              {today === null ? (
                <p className="text-sm text-neutral-500">Checking…</p>
              ) : today.length === 0 ? (
                <p className="text-sm text-neutral-500">No bookings today – open 06:00 – 24:00</p>
              ) : (
                <p className="text-sm text-neutral-600">{today.map((s) => formatRange(s.startMinutes, s.endMinutes)).join(", ")}</p>
              )}
            </div>

            <div className="mt-8">
              {authLoading && <p className="text-sm text-neutral-500">Checking your account…</p>}
              {user?.role === "member" && (
                <Link href={`/facilities/${facility._id}/book`} className="btn-primary">
                  Book this facility
                </Link>
              )}
              {!authLoading && !user && (
                <p className="text-sm text-neutral-600">
                  <Link href="/login" className="btn-primary mr-3">Log in to book</Link>
                  No account? <Link href="/register" className="underline">Register</Link>
                </p>
              )}
              {user?.role === "admin" && (
                <Link href={`/admin/facilities/${facility._id}/edit`} className="btn-secondary">
                  Edit facility
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-neutral-500">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}
