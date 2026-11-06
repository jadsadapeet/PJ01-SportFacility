"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={`rounded-md px-3 py-2 text-sm ${
        active ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-100"
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
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="text-lg font-bold tracking-tight">
          SportBook
        </Link>

        <nav className="flex flex-wrap items-center gap-1">
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
              <Link href="/login" className="btn-secondary ml-2">
                Log in
              </Link>
              <Link href="/register" className="btn-primary">
                Register
              </Link>
            </>
          )}

          {!loading && user && (
            <>
              <span className="ml-3 hidden text-sm text-neutral-500 sm:inline">
                {user.name} ({user.role})
              </span>
              <button onClick={onLogout} className="btn-secondary ml-2">
                Log out
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
