export type Query = Record<
  string,
  string | number | boolean | null | undefined
>;

export class ApiError extends Error {
  constructor(
    public status: number,
    /** Always at least one message. Validation errors can have several. */
    public messages: string[],
  ) {
    super(messages[0]);
  }
}

function toSearch(query?: Query) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

interface Options {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Query;
  signal?: AbortSignal;
}

/**
 * Calls the backend through the same-origin proxy.
 * `path` is relative to /api, e.g. `admin/doctor` or `auth/admin/me`.
 */
export async function api<T>(path: string, opts: Options = {}): Promise<T> {
  const res = await fetch(`/api/backend/${path}${toSearch(opts.query)}`, {
    method: opts.method ?? "GET",
    headers:
      opts.body !== undefined
        ? { "content-type": "application/json" }
        : undefined,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });

  if (res.status === 401 && typeof window !== "undefined") {
    const next = encodeURIComponent(
      window.location.pathname + window.location.search,
    );
    // Full reload on purpose: clears all client state when the session is gone.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `/admin/login?next=${next}`;
    throw new ApiError(401, ["Session expired"]);
  }
  if (res.status === 204) return undefined as T;

  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const raw = (data as { message?: string | string[] } | null)?.message;
    const messages = Array.isArray(raw)
      ? raw
      : [raw ?? `Request failed (${res.status})`];
    throw new ApiError(res.status, messages);
  }
  return data as T;
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.messages.join(". ");
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}
