"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api, errorMessage, type Facility } from "@/lib/api";
import { Empty, ErrorBanner, FacilityImage, Loading, PageHeader } from "@/components/ui";

// 01 Home – public facility list with search and sport filter.
export default function HomePage() {
  const [facilities, setFacilities] = useState<Facility[] | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [sport, setSport] = useState("");

  useEffect(() => {
    api<Facility[]>("/facilities")
      .then(setFacilities)
      .catch((e) => setError(errorMessage(e)));
  }, []);

  const sports = useMemo(
    () => [...new Set((facilities ?? []).map((f) => f.sportType))].sort(),
    [facilities]
  );

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (facilities ?? []).filter(
      (f) =>
        (!sport || f.sportType === sport) &&
        (!q || f.name.toLowerCase().includes(q) || f.location.toLowerCase().includes(q))
    );
  }, [facilities, query, sport]);

  return (
    <>
      <PageHeader
        title="Sports Facilities"
        subtitle="Find and book badminton, tennis, futsal courts and gyms"
      />

      <div className="card mb-6 grid gap-4 p-4 sm:grid-cols-[1fr_220px]">
        <div>
          <label className="label" htmlFor="search">Search</label>
          <input
            id="search"
            className="input"
            placeholder="Search by facility name or location…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="sport">Sport type</label>
          <select id="sport" className="input" value={sport} onChange={(e) => setSport(e.target.value)}>
            <option value="">All sports</option>
            {sports.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <ErrorBanner title="Could not load facilities" message={error} />}
      {!facilities && !error && <Loading />}
      {facilities && shown.length === 0 && (
        <Empty>{facilities.length === 0 ? "No facilities yet." : "No facilities match your search."}</Empty>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((f) => (
          <div key={f._id} className="card flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand/10">
            <FacilityImage sportType={f.sportType} className="h-40 border-b border-line" />
            <div className="flex flex-1 flex-col p-4">
              <h2 className="text-lg font-bold">
                <Link href={`/facilities/${f._id}`} className="hover:text-brand">{f.name}</Link>
              </h2>
              <p className="mt-1 text-[13px] text-muted">
                {f.location} · {f.capacity} {f.capacity === 1 ? "person" : "people"}
              </p>
              <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                <p className="text-[15px] text-ink">
                  <span className="font-display text-xl font-bold">{f.hourlyRate.toLocaleString("en-US")}</span> THB/hr
                </p>
                <Link href={`/facilities/${f._id}`} className="btn-primary btn-sm">
                  Book
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
