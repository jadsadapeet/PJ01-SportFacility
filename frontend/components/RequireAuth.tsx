"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { homeFor, useAuth } from "@/lib/auth";
import type { Role } from "@/lib/api";
import { Loading } from "./ui";

// Client-side guard: sends guests to login and wrong roles to their home page.
export default function RequireAuth({ role, children }: { role?: Role; children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const allowed = !!user && (!role || user.role === role);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (role && user.role !== role) router.replace(homeFor(user.role));
  }, [loading, user, role, router]);

  if (loading || !allowed) return <Loading />;
  return <>{children}</>;
}
