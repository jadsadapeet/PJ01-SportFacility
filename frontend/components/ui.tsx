"use client";

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
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>}
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
    <div role="alert" className="mb-4 flex gap-3 rounded-md border-2 border-neutral-900 bg-neutral-100 p-4">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">
        !
      </span>
      <div>
        {(title || code) && (
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
            {title}
            {code && (
              <span className="rounded bg-neutral-900 px-1.5 py-0.5 font-mono text-xs font-medium text-white">
                {code} {STATUS_TEXT[code] ?? "Error"}
              </span>
            )}
          </p>
        )}
        <p className="mt-0.5 text-sm text-neutral-800">{message}</p>
      </div>
    </div>
  );
}

export function SuccessBanner({ message }: { message: string }) {
  return (
    <div role="status" className="mb-4 rounded-md border border-neutral-300 bg-neutral-100 px-4 py-3 text-sm font-medium">
      ✓&nbsp;&nbsp;{message}
    </div>
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
  return <p className="py-12 text-center text-sm text-neutral-500">{text}</p>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="card py-12 text-center text-sm text-neutral-500">{children}</div>
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
      {error ? <p className="field-error">{error}</p> : hint ? <p className="mt-1 text-xs text-neutral-500">{hint}</p> : null}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        className="card w-full max-w-sm p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-neutral-700">{detail}</p>
        <p className="mt-1 text-sm text-neutral-500">This action cannot be undone.</p>
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button className="btn-primary" onClick={onConfirm} disabled={busy}>
            {busy ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// Grayscale placeholder instead of a photo.
export function FacilityImage({ sportType, className = "" }: { sportType: string; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center bg-neutral-200 text-xs font-semibold tracking-widest text-neutral-500 uppercase ${className}`}
    >
      {sportType}
    </div>
  );
}
