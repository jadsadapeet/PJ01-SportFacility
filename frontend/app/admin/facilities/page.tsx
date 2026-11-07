"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { dismissFlash } from "@/lib/flash";
import { api, errorMessage, type Facility } from "@/lib/api";
import { formatBaht } from "@/lib/time";
import RequireAuth from "@/components/RequireAuth";
import { ConfirmDialog, Empty, ErrorBanner, FlashMessage, Loading, PageHeader, SuccessBanner } from "@/components/ui";

// A4 Manage Facilities (admin).
export default function ManageFacilitiesPage() {
  return (
    <RequireAuth role="admin">
      <ManageFacilities />
    </RequireAuth>
  );
}

function ManageFacilities() {
  const [facilities, setFacilities] = useState<Facility[] | null>(null);
  const [error, setError] = useState("");
  const [toDelete, setToDelete] = useState<Facility | null>(null);
  const [busy, setBusy] = useState(false);
  const [deletedMsg, setDeletedMsg] = useState("");

  useEffect(() => {
    api<Facility[]>("/facilities")
      .then(setFacilities)
      .catch((e) => setError(errorMessage(e)));
  }, []);

  const confirmDelete = async () => {
    if (!toDelete) return;
    setBusy(true);
    setError("");
    try {
      await api(`/facilities/${toDelete._id}`, { method: "DELETE" });
      setFacilities((list) => (list ?? []).filter((f) => f._id !== toDelete._id));
      setDeletedMsg(`${toDelete.name} was removed`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
      setToDelete(null);
    }
  };

  return (
    <>
      <FlashMessage />
      {deletedMsg && <SuccessBanner message={deletedMsg} />}
      <PageHeader
        title="Manage Facilities"
        subtitle="Add, update or remove facilities"
        action={<Link href="/admin/facilities/new" className="btn-primary">+ Add facility</Link>}
      />
      {error && <ErrorBanner message={error} />}
      {!facilities && !error && <Loading />}
      {facilities && facilities.length === 0 && <Empty>No facilities yet. Add the first one.</Empty>}

      {facilities && facilities.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="border-b border-neutral-200 bg-neutral-50">
              <tr>
                <th className="th">Name</th>
                <th className="th">Sport type</th>
                <th className="th">Location</th>
                <th className="th">Capacity</th>
                <th className="th">Rate</th>
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {facilities.map((f) => (
                <tr key={f._id}>
                  <td className="td font-medium">
                    <Link href={`/facilities/${f._id}`} className="hover:underline">{f.name}</Link>
                  </td>
                  <td className="td">{f.sportType}</td>
                  <td className="td">{f.location}</td>
                  <td className="td">{f.capacity}</td>
                  <td className="td whitespace-nowrap">{formatBaht(f.hourlyRate)}</td>
                  <td className="td">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/facilities/${f._id}/edit`} className="btn-secondary btn-sm">Edit</Link>
                      <button className="btn-danger btn-sm" onClick={() => { setDeletedMsg(""); setError(""); dismissFlash(); setToDelete(f); }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Delete this facility?"
          detail={`${toDelete.name} will be hidden and can no longer be booked. Existing bookings stay in the system.`}
          busy={busy}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </>
  );
}
