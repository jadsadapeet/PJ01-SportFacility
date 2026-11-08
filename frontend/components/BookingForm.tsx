"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, errorMessage, type Booking, type BusySlot, type Facility, type User } from "@/lib/api";
import { setFlash } from "@/lib/flash";
import { useAuth } from "@/lib/auth";
import {
  CLOSE_HOUR,
  formatBaht,
  formatDate,
  formatRange,
  isoDate,
  localNow,
  startTimeOptions,
  toMinutes,
  validateBooking,
  type BookingDraft,
} from "@/lib/time";
import AvailabilityBar, { type Range } from "./AvailabilityBar";
import { ErrorBanner, Field } from "./ui";

const RULES = [
  "Date cannot be in the past",
  "Max 2 hours per booking",
  "You cannot have overlapping bookings",
  "A facility cannot be double-booked",
];

interface Props {
  mode: "create" | "edit";
  facility: Facility; // initial facility
  facilities?: Facility[]; // choices when editing
  booking?: Booking; // when editing
  owner: User; // the member this booking belongs to
  returnTo: string;
}

const ownerId = (u: User | null | undefined) => u?._id || u?.id || "";

// Shared form for 05 Create Booking, 07 Edit Booking and A2 Admin edit.
export default function BookingForm({ mode, facility: initialFacility, facilities, booking, owner, returnTo }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  // Admin edits someone else's booking; members always act on their own.
  const forOther = user?.role === "admin";
  const [facilityId, setFacilityId] = useState(initialFacility._id);
  const [draft, setDraft] = useState<BookingDraft>({
    bookingDate: booking ? isoDate(booking.bookingDate) : "",
    startTime: booking?.startTime ?? "",
    durationHours: booking ? String(booking.durationHours) : "1",
  });
  const [touched, setTouched] = useState(false);
  // Error returned by the backend (400 / 409 / ...), cleared on the next edit or submit.
  const [serverError, setServerError] = useState<{ status: number; message: string } | null>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [booked, setBooked] = useState<BusySlot[]>([]);
  const [ownBookings, setOwnBookings] = useState<Booking[]>([]);

  const facility = (facilities ?? []).find((f) => f._id === facilityId) ?? initialFacility;
  const now = localNow();

  // The owner's existing bookings, used to warn about overlaps before submitting.
  const ownerKey = ownerId(owner);
  useEffect(() => {
    api<Booking[]>("/bookings")
      .then((list) => setOwnBookings(list.filter((b) => ownerId(b.user) === ownerKey)))
      .catch(() => setOwnBookings([]));
  }, [ownerKey]);

  // Booked time ranges of the selected facility on the selected date.
  const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(draft.bookingDate);
  useEffect(() => {
    if (!dateOk) return;
    let cancelled = false;
    api<BusySlot[]>(`/facilities/${facilityId}/availability?date=${draft.bookingDate}`)
      .then((list) => !cancelled && setBooked(list))
      .catch(() => !cancelled && setBooked([]));
    return () => {
      cancelled = true;
    };
  }, [facilityId, draft.bookingDate, dateOk]);

  const bookedOthers: Range[] = dateOk ? booked.filter((b) => b.id !== booking?._id) : [];
  const mineOthers: Range[] = ownBookings.filter(
    (b) => b._id !== booking?._id && dateOk && isoDate(b.bookingDate) === draft.bookingDate && b.facility?._id !== facilityId
  );

  const errors = validateBooking(draft);
  const duration = Number(draft.durationHours);
  const selection: Range | null =
    !errors.startTime && !errors.durationHours
      ? { startMinutes: toMinutes(draft.startTime), endMinutes: toMinutes(draft.startTime) + duration * 60 }
      : null;

  const overlap = (() => {
    if (!selection) return "";
    const hit = (r: Range) => r.startMinutes < selection.endMinutes && r.endMinutes > selection.startMinutes;
    if (bookedOthers.some(hit)) return "This facility is already booked during that time";
    const own = ownBookings.find(
      (b) => b._id !== booking?._id && isoDate(b.bookingDate) === draft.bookingDate && hit(b)
    );
    if (own) return `${forOther ? "This member already has" : "You already have"} a booking then (${own.facility?.name ?? "another facility"}, ${formatRange(own.startMinutes, own.endMinutes)})`;
    return "";
  })();

  const shownErrors = touched ? errors : {};
  const total = Number.isFinite(duration) && duration > 0 ? facility.hourlyRate * duration : 0;

  // Editing the form hides the previous server error; it no longer applies.
  const update = (next: BookingDraft) => {
    setDraft(next);
    setServerError(null);
  };
  const set = (key: keyof BookingDraft) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    update({ ...draft, [key]: e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setServerError(null);
    // Always submit: the backend is the source of truth for the booking rules,
    // and its 400/409 response is shown in the banner (demo step 4).
    setBusy(true);
    const body = {
      facility: facilityId,
      bookingDate: draft.bookingDate,
      startTime: draft.startTime,
      durationHours: draft.durationHours === "" ? undefined : duration,
    };
    try {
      if (mode === "create") await api("/bookings", { method: "POST", body });
      else await api(`/bookings/${booking!._id}`, { method: "PUT", body });
      setFlash(mode === "create" ? "Booking created successfully" : "Booking updated successfully");
      router.push(returnTo);
    } catch (err) {
      setServerError({ status: err instanceof ApiError ? err.status : 0, message: errorMessage(err) });
      setBusy(false);
      requestAnimationFrame(() => bannerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
    }
  };

  const cls = (k: keyof BookingDraft) => `input ${shownErrors[k] ? "input-error" : ""}`;
  // A past date is fully "passed"; today is passed up to the current minute.
  const pastUntil = !dateOk ? null : draft.bookingDate < now.date ? CLOSE_HOUR * 60 : draft.bookingDate === now.date ? now.minutes : null;

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="card p-6">
        <div ref={bannerRef}>
          {serverError && (
            <ErrorBanner
              title={mode === "create" ? "Cannot create booking" : "Cannot save changes"}
              code={serverError.status || undefined}
              message={serverError.message}
            />
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {mode === "edit" && (
            <div className="sm:col-span-2">
              <Field label="Member (read-only)">
                <input className="input" readOnly value={`${owner.name} (${owner.email})`} />
              </Field>
            </div>
          )}

          <div className="sm:col-span-2">
            <Field label="Facility">
              {mode === "edit" && facilities ? (
                <select className="input" value={facilityId} onChange={(e) => { setFacilityId(e.target.value); setServerError(null); }}>
                  {facilities.map((f) => (
                    <option key={f._id} value={f._id}>
                      {f.name} · {f.sportType}
                    </option>
                  ))}
                </select>
              ) : (
                <input className="input" readOnly value={facility.name} />
              )}
            </Field>
          </div>

          <Field label="Date" error={shownErrors.bookingDate}>
            <input type="date" className={cls("bookingDate")} min={now.date} value={draft.bookingDate} onChange={set("bookingDate")} />
          </Field>

          <Field label="Start time (HH:mm)" error={shownErrors.startTime}>
            <select className={cls("startTime")} value={draft.startTime} onChange={set("startTime")}>
              <option value="">Choose a time</option>
              {startTimeOptions().map((t) => {
                const m = toMinutes(t);
                const taken = bookedOthers.some((b) => b.startMinutes <= m && b.endMinutes > m);
                const passed = pastUntil !== null && m <= pastUntil;
                return (
                  <option key={t} value={t}>
                    {t}{taken ? "  (booked)" : passed ? "  (passed)" : ""}
                  </option>
                );
              })}
            </select>
          </Field>

          <Field label="Duration (0.5 – 2 hours)" error={shownErrors.durationHours}>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.5"
                min="0.5"
                className={cls("durationHours")}
                value={draft.durationHours}
                onChange={set("durationHours")}
              />
              <span className="text-sm text-muted">hours</span>
            </div>
          </Field>

          <div className="flex items-end">
            {selection && (
              <p className="pb-3 text-[13px] text-muted">
                Ends at <strong className="text-ink">{formatRange(selection.startMinutes, selection.endMinutes).split(" – ")[1]}</strong>
              </p>
            )}
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-3 text-sm font-semibold">
            Availability {dateOk ? `on ${formatDate(draft.bookingDate)}` : ""}
          </p>
          {dateOk ? (
            <AvailabilityBar
              booked={bookedOthers}
              mine={mineOthers}
              pastUntil={pastUntil}
              selection={selection}
              mineLabel={forOther ? "Member's other booking" : "Your other booking"}
              onPick={(t) => update({ ...draft, startTime: t })}
            />
          ) : (
            <p className="rounded-xl border border-dashed border-line bg-surface-2/50 p-4 text-center text-sm text-muted">
              Choose a date to see which times are free
            </p>
          )}
          {overlap && <p className="field-error mt-2">{overlap}</p>}
        </div>

        <div className="mt-6 flex gap-2">
          <button className="btn-primary" disabled={busy}>
            {busy ? "Saving…" : mode === "create" ? "Confirm booking" : "Save changes"}
          </button>
          <button type="button" className="btn-secondary" onClick={() => router.push(returnTo)} disabled={busy}>
            Cancel
          </button>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="card p-5">
          <p className="eyebrow mb-3">Summary</p>
          <p className="font-display text-lg font-bold">{facility.name}</p>
          <p className="text-[13px] text-muted">{facility.location}</p>
          <p className="text-[13px] text-muted">{formatBaht(facility.hourlyRate)} / hour</p>
          <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
            <Row k="Date" v={dateOk ? formatDate(draft.bookingDate) : "–"} />
            <Row k="Time" v={selection ? formatRange(selection.startMinutes, selection.endMinutes) : "–"} />
            <Row k="Duration" v={Number.isFinite(duration) && duration > 0 ? `${duration} h` : "–"} />
          </dl>
          <p className="mt-4 flex items-baseline justify-between border-t border-line pt-4 font-semibold">
            <span>Total</span>
            <span className="font-display text-2xl font-bold text-brand">{formatBaht(total)}</span>
          </p>
          <p className="mt-1 text-xs text-muted">Pay at the counter. Open daily 06:00 – {String(CLOSE_HOUR).padStart(2, "0")}:00.</p>
        </div>

        <div className="card p-5">
          <p className="eyebrow mb-3">Booking rules</p>
          <ul className="space-y-2 text-sm text-ink">
            {RULES.map((r) => (
              <li key={r} className="flex gap-2"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-lime" />{r}</li>
            ))}
          </ul>
        </div>
      </aside>
    </form>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
