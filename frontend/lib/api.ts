// Thin wrapper around fetch for the Sports Facility Booking API.

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

const TOKEN_KEY = "sportbook_token";

export type Role = "member" | "admin";

export interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  tel?: string;
  role: Role;
}

export interface Facility {
  _id: string;
  name: string;
  sportType: string;
  location: string;
  capacity: number;
  hourlyRate: number;
}

export interface Booking {
  _id: string;
  facility: Facility | null;
  user: User | null;
  bookingDate: string;
  startTime: string;
  durationHours: number;
  startMinutes: number;
  endMinutes: number;
}

export interface BusySlot {
  id: string;
  startTime: string;
  startMinutes: number;
  endMinutes: number;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const tokenStore = {
  get: () => (typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY)),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const headers: Record<string, string> = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: options.method || "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError("Cannot reach the server. Is the backend running?", 0);
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new ApiError(friendlyError(json.error, res.status), res.status);
  }
  return json.data as T;
}

// Turn raw backend/Mongoose messages into something readable.
function friendlyError(error: unknown, status: number): string {
  const msg = typeof error === "string" ? error : "";
  if (/E11000/.test(msg) && /email/.test(msg)) return "This email is already registered";
  if (/E11000/.test(msg) && /name/.test(msg)) return "A facility with this name already exists";
  if (/Cast to ObjectId/.test(msg)) return "Item not found";
  if (msg.startsWith("User validation failed:") || msg.startsWith("Facility validation failed:")) {
    return msg.replace(/^\w+ validation failed: /, "").replace(/\w+: /g, "");
  }
  if (msg) return msg;
  if (status === 429) return "Too many requests, please try again later";
  return "Something went wrong";
}

export const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Something went wrong";
