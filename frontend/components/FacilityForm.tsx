"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, errorMessage, type Facility } from "@/lib/api";
import { setFlash } from "@/lib/flash";
import { ErrorBanner, Field } from "./ui";

type Draft = { name: string; sportType: string; location: string; capacity: string; hourlyRate: string };
type Errors = Partial<Record<keyof Draft, string>>;

const SPORT_SUGGESTIONS = ["Badminton", "Tennis", "Futsal", "Basketball", "Volleyball", "Table Tennis", "Swimming", "Fitness"];

function validate(d: Draft): Errors {
  const e: Errors = {};
  if (!d.name.trim()) e.name = "Please add a facility name";
  if (!d.sportType.trim()) e.sportType = "Please add a sport type";
  if (!d.location.trim()) e.location = "Please add a location";
  if (!Number.isInteger(Number(d.capacity)) || Number(d.capacity) < 1) e.capacity = "Capacity must be a whole number, at least 1";
  if (d.hourlyRate === "" || !Number.isFinite(Number(d.hourlyRate)) || Number(d.hourlyRate) < 0) e.hourlyRate = "Hourly rate cannot be negative";
  return e;
}

// A5 Add Facility and the matching Edit Facility page.
export default function FacilityForm({ facility }: { facility?: Facility }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>({
    name: facility?.name ?? "",
    sportType: facility?.sportType ?? "",
    location: facility?.location ?? "",
    capacity: facility ? String(facility.capacity) : "",
    hourlyRate: facility ? String(facility.hourlyRate) : "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraft({ ...draft, [k]: e.target.value });
    setServerError("");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    const found = validate(draft);
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    const body = {
      name: draft.name.trim(),
      sportType: draft.sportType.trim(),
      location: draft.location.trim(),
      capacity: Number(draft.capacity),
      hourlyRate: Number(draft.hourlyRate),
    };
    try {
      if (facility) await api(`/facilities/${facility._id}`, { method: "PUT", body });
      else await api("/facilities", { method: "POST", body });
      setFlash(facility ? "Facility updated successfully" : "Facility created successfully");
      router.push("/admin/facilities");
    } catch (err) {
      setServerError(errorMessage(err));
      setBusy(false);
    }
  };

  const cls = (k: keyof Draft) => `input ${errors[k] ? "input-error" : ""}`;

  return (
    <form onSubmit={onSubmit} noValidate className="card max-w-2xl space-y-4 p-6">
      {serverError && <ErrorBanner title={facility ? "Could not save facility" : "Could not create facility"} message={serverError} />}

      <Field label="Facility name" error={errors.name}>
        <input className={cls("name")} value={draft.name} onChange={set("name")} placeholder="Badminton Court B" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Sport type" error={errors.sportType}>
          <input className={cls("sportType")} list="sport-types" value={draft.sportType} onChange={set("sportType")} placeholder="Badminton" />
          <datalist id="sport-types">
            {SPORT_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
          </datalist>
        </Field>
        <Field label="Location" error={errors.location}>
          <input className={cls("location")} value={draft.location} onChange={set("location")} placeholder="Sports Center, Floor 1" />
        </Field>
        <Field label="Capacity (people)" error={errors.capacity}>
          <input className={cls("capacity")} type="number" min="1" step="1" value={draft.capacity} onChange={set("capacity")} />
        </Field>
        <Field label="Hourly rate (THB)" error={errors.hourlyRate}>
          <input className={cls("hourlyRate")} type="number" min="0" step="10" value={draft.hourlyRate} onChange={set("hourlyRate")} />
        </Field>
      </div>
      <div className="flex gap-2 pt-2">
        <button className="btn-primary" disabled={busy}>
          {busy ? "Saving…" : facility ? "Save changes" : "Create facility"}
        </button>
        <button type="button" className="btn-secondary" onClick={() => router.push("/admin/facilities")} disabled={busy}>
          Cancel
        </button>
      </div>
    </form>
  );
}
