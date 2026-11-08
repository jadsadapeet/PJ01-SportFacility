"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Logo } from "./ui";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={`whitespace-nowrap rounded-lg px-2.5 py-2 text-sm lg:px-3.5 ${
        active ? "bg-surface-2 font-semibold text-brand" : "font-medium text-ink hover:bg-surface-2"
      }`}
    >
      {children}
    </Link>
  );
}

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const onLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 font-display text-lg font-bold tracking-tight">
          <Logo />
          SportBook
        </Link>

        <nav className="flex items-center gap-1">
          <NavLink href="/">Facilities</NavLink>
          {!loading && user?.role === "member" && <NavLink href="/bookings">My Bookings</NavLink>}
          {!loading && user?.role === "admin" && (
            <>
              <NavLink href="/admin/bookings">All Bookings</NavLink>
              <NavLink href="/admin/facilities">Manage Facilities</NavLink>
            </>
          )}

          {!loading && !user && (
            <>
              <Link href="/login" className="btn-secondary btn-sm ml-2">
                Log in
              </Link>
              <Link href="/register" className="btn-primary btn-sm">
                Register
              </Link>
            </>
          )}

          {!loading && user && (
            <>
              <span className="ml-3 hidden whitespace-nowrap text-sm text-muted lg:inline">
                {user.name} ({user.role})
              </span>
              <button onClick={onLogout} className="btn-secondary btn-sm ml-2 whitespace-nowrap">
                Log out
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
