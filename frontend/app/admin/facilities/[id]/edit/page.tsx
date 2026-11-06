"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, errorMessage, type Facility } from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";
import FacilityForm from "@/components/FacilityForm";
import { ErrorBanner, Loading, PageHeader } from "@/components/ui";

// Edit Facility (admin) – same form as A5.
export default function EditFacilityPage() {
  return (
    <RequireAuth role="admin">
      <EditFacility />
    </RequireAuth>
  );
}

function EditFacility() {
  const { id } = useParams<{ id: string }>();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Facility>(`/facilities/${id}`)
      .then(setFacility)
      .catch((e) => setError(errorMessage(e)));
  }, [id]);

  return (
    <>
      <PageHeader title="Edit facility" subtitle={facility?.name} />
      {error && <ErrorBanner title="Facility not available" message={error} />}
      {!facility && !error && <Loading />}
      {facility && <FacilityForm facility={facility} />}
    </>
  );
}
