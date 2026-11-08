"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { clearFlash, DISMISS_EVENT, peekFlash } from "@/lib/flash";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 text-base text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const STATUS_TEXT: Record<number, string> = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  409: "Conflict",
  429: "Too Many Requests",
  500: "Server Error",
};

export function ErrorBanner({ title, message, code }: { title?: string; message: string; code?: number }) {
  return (
    <div role="alert" className="mb-4 flex gap-3 rounded-xl border border-danger-line bg-danger-soft px-4 py-3.5">
      <AlertIcon />
      <div>
        {(title || code) && (
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-danger">
            {title}
            {code && (
              <span className="rounded-md bg-danger px-1.5 py-0.5 font-mono text-xs font-medium text-white">
                {code} {STATUS_TEXT[code] ?? "Error"}
              </span>
            )}
          </p>
        )}
        <p className={`text-[13px] text-ink ${title || code ? "mt-0.5" : ""}`}>{message}</p>
      </div>
    </div>
  );
}

export function SuccessBanner({ message }: { message: string }) {
  return (
    <div role="status" className="mb-4 flex items-center gap-3 rounded-xl border border-success-line bg-success-soft px-4 py-3.5">
      <CheckIcon />
      <p className="text-sm font-semibold text-brand">{message}</p>
    </div>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" className="mt-px h-5 w-5 shrink-0 text-danger" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V13" />
      <circle cx="12" cy="16.6" r="0.6" fill="currentColor" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-brand" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.7 2.7L16 9.8" />
    </svg>
  );
}

// Shows the one-time message set by the previous page, if any.
export function FlashMessage() {
  const [msg, setMsg] = useState(peekFlash);
  useEffect(() => {
    clearFlash();
    const hide = () => setMsg(null);
    window.addEventListener(DISMISS_EVENT, hide);
    return () => window.removeEventListener(DISMISS_EVENT, hide);
  }, []);
  return msg ? <SuccessBanner message={msg} /> : null;
}

export function Loading({ text = "Loading…" }: { text?: string }) {
  return <p className="py-12 text-center text-sm text-muted">{text}</p>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="card py-12 text-center text-sm text-muted">{children}</div>
  );
}

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error ? <p className="field-error">{error}</p> : hint ? <p className="mt-1.5 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function ConfirmDialog({
  title,
  detail,
  confirmLabel = "Delete",
  busy,
  onConfirm,
  onCancel,
}: {
  title: string;
  detail: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-[2px]" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        className="card w-full max-w-sm p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="mt-2 text-sm text-ink">{detail}</p>
        <p className="mt-1 text-sm text-muted">This action cannot be undone.</p>
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button className="btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// SportBook mark: court-green tile with a lime ball.
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center bg-brand"
      style={{ width: size, height: size, borderRadius: size * 0.28 }}
      aria-hidden
    >
      <span className="rounded-full bg-lime" style={{ width: size * 0.4, height: size * 0.4 }} />
    </span>
  );
}

// One photo per sport, stored in public/sports (see CREDITS.md there).
// The optional third value is the focus point used when the photo is cropped.
const SPORT_PHOTOS: [RegExp, string, string?][] = [
  [/badminton/, "/sports/badminton.jpg", "50% 15%"],
  [/tennis/, "/sports/tennis.jpg"],
  [/futsal|football|soccer/, "/sports/futsal.jpg"],
  [/basket/, "/sports/basketball.jpg"],
  [/gym|fitness|weight/, "/sports/fitness.jpg"],
];

const photoFor = (sport: string) => SPORT_PHOTOS.find(([re]) => re.test(sport.toLowerCase()));

export function FacilityImage({
  sportType,
  className = "",
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px",
  priority = false,
}: {
  sportType: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const photo = photoFor(sportType);
  return (
    <div className={`relative overflow-hidden bg-brand ${className}`}>
      {photo ? (
        <>
          <Image src={photo[1]} alt={sportType} fill sizes={sizes} priority={priority} className="object-cover" style={{ objectPosition: photo[2] }} />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink/50 to-transparent" />
        </>
      ) : (
        // No photo for this sport: draw court lines on green instead.
        <svg viewBox="0 0 200 120" className="absolute inset-0 h-full w-full [&_*]:[vector-effect:non-scaling-stroke]" aria-hidden>
          <g fill="none" stroke="white" strokeOpacity={0.45} strokeWidth={2}>
            <rect x="16" y="14" width="168" height="92" rx="4" />
            <path d="M100 14v92M16 24h168M16 96h168M72 14v92M128 14v92M28 60h44M128 60h44" />
          </g>
        </svg>
      )}
      <span className="chip chip-lime absolute bottom-3 left-3 h-6 text-xs">{sportType}</span>
    </div>
  );
}
