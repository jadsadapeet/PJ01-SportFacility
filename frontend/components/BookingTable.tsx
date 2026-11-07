"use client";

import Link from "next/link";
import { useState } from "react";
import { api, errorMessage, type Booking } from "@/lib/api";
import { formatBaht, formatDate, formatHours, formatRange, isoDate, localNow } from "@/lib/time";
import { dismissFlash } from "@/lib/flash";
import { ConfirmDialog, Empty, ErrorBanner, SuccessBanner } from "./ui";

// Finished bookings can no longer be edited (the date would be in the past).
export const isPast = (b: Booking) => {
  const now = localNow();
  const d = isoDate(b.bookingDate);
  return d < now.date || (d === now.date && b.endMinutes <= now.minutes);
};

export default function BookingTable({
  bookings,
  showMember,
  onDeleted,
  emptyText,
}: {
  bookings: Booking[];
  showMember?: boolean;
  onDeleted: (id: string) => void;
  emptyText: React.ReactNode;
}) {
  const [toDelete, setToDelete] = useState<Booking | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [deletedMsg, setDeletedMsg] = useState("");

  const confirmDelete = async () => {
    if (!toDelete) return;
    setBusy(true);
    setError("");
    try {
      await api(`/bookings/${toDelete._id}`, { method: "DELETE" });
      onDeleted(toDelete._id);
      setDeletedMsg("Booking deleted successfully");
      setToDelete(null);
    } catch (err) {
      setError(errorMessage(err));
      setToDelete(null);
    } finally {
      setBusy(false);
    }
  };

  const describe = (b: Booking) =>
    [b.facility?.name, showMember ? b.user?.name : null, formatDate(b.bookingDate), formatRange(b.startMinutes, b.endMinutes)]
      .filter(Boolean)
      .join(" · ");

  return (
    <>
      {deletedMsg && <SuccessBanner message={deletedMsg} />}
      {error && <ErrorBanner title="Could not delete booking" message={error} />}

      {bookings.length === 0 ? (
        <Empty>{emptyText}</Empty>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="border-b border-neutral-200 bg-neutral-50">
              <tr>
                <th className="th">Facility</th>
                <th className="th">Date</th>
                <th className="th">Time</th>
                <th className="th">Duration</th>
                <th className="th">Price</th>
                {showMember && <th className="th">Booked by</th>}
                <th className="th sticky right-0 bg-neutral-50 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {bookings.map((b) => {
                const past = isPast(b);
                return (
                  <tr key={b._id} className={past ? "text-neutral-400" : ""}>
                    <td className="td font-medium">
                      {b.facility?.name ?? "Removed facility"}
                      {b.facility && <span className="block text-xs font-normal text-neutral-500">{b.facility.sportType} · {b.facility.location}</span>}
                    </td>
                    <td className="td whitespace-nowrap">{formatDate(b.bookingDate)}</td>
                    <td className="td whitespace-nowrap">{formatRange(b.startMinutes, b.endMinutes)}</td>
                    <td className="td">{formatHours(b.durationHours)}</td>
                    <td className="td whitespace-nowrap">{b.facility ? formatBaht(b.facility.hourlyRate * b.durationHours) : "–"}</td>
                    {showMember && (
                      <td className="td">
                        {b.user?.name ?? "Deleted user"}
                        {b.user && <span className="block text-xs text-neutral-500">{b.user.email}</span>}
                      </td>
                    )}
                    <td className="td sticky right-0 bg-white">
                      <div className="flex justify-end gap-2">
                        {past ? (
                          <span className="px-3 py-1 text-xs">Finished</span>
                        ) : (
                          <Link href={`/bookings/${b._id}/edit`} className="btn-secondary btn-sm">
                            Edit
                          </Link>
                        )}
                        <button className="btn-danger btn-sm" onClick={() => { setDeletedMsg(""); setError(""); dismissFlash(); setToDelete(b); }}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Delete this booking?"
          detail={describe(toDelete)}
          busy={busy}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </>
  );
}
