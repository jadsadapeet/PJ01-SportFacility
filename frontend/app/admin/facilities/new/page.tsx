"use client";

import RequireAuth from "@/components/RequireAuth";
import FacilityForm from "@/components/FacilityForm";
import { PageHeader } from "@/components/ui";

// A5 Add Facility (admin).
export default function AddFacilityPage() {
  return (
    <RequireAuth role="admin">
      <PageHeader title="Add facility" subtitle="New facility gets an id for bookings" />
      <FacilityForm />
    </RequireAuth>
  );
}
