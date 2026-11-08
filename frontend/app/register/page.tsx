"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { homeFor, useAuth, type RegisterInput } from "@/lib/auth";
import { errorMessage } from "@/lib/api";
import { ErrorBanner, Field, Logo } from "@/components/ui";

type Errors = Partial<Record<keyof RegisterInput, string>>;

function validate(f: RegisterInput): Errors {
  const e: Errors = {};
  if (!f.name.trim()) e.name = "Please add a name";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = "Please add a valid email";
  if (!/^0\d{1,2}-?\d{3}-?\d{4}$/.test(f.tel.trim())) e.tel = "Please add a valid phone number, e.g. 081-234-5678";
  if (f.password.length < 6) e.password = "Password must be at least 6 characters";
  return e;
}

// 02 Register – name, email, tel, password. Always creates a member account.
export default function RegisterPage() {
  const { user, loading, register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState<RegisterInput>({ name: "", email: "", tel: "", password: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace(homeFor(user.role));
  }, [loading, user, router]);

  const set = (key: keyof RegisterInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      const u = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        tel: form.tel.trim(),
        password: form.password,
      });
      router.push(homeFor(u.role));
    } catch (err) {
      setServerError(errorMessage(err));
      setBusy(false);
    }
  };

  const cls = (k: keyof RegisterInput) => `input ${errors[k] ? "input-error" : ""}`;

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-8 sm:p-10">
        <Logo size={40} />
        <h1 className="mt-5 text-3xl font-bold">Create account</h1>
        <p className="mt-1 mb-6 text-[15px] text-muted">Sign up as a member to book facilities</p>

        {serverError && <ErrorBanner title="Could not register" message={serverError} />}

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <Field label="Name" error={errors.name}>
            <input className={cls("name")} autoComplete="name" value={form.name} onChange={set("name")} />
          </Field>
          <Field label="Email" error={errors.email}>
            <input className={cls("email")} type="email" autoComplete="email" value={form.email} onChange={set("email")} />
          </Field>
          <Field label="Tel" error={errors.tel}>
            <input className={cls("tel")} type="tel" autoComplete="tel" placeholder="081-234-5678" value={form.tel} onChange={set("tel")} />
          </Field>
          <Field label="Password" error={errors.password} hint="At least 6 characters">
            <input className={cls("password")} type="password" autoComplete="new-password" value={form.password} onChange={set("password")} />
          </Field>
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? "Creating account…" : "Register"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="link">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
