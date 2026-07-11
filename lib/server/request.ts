const API_BASE = "https://api.wynncraft.com/v3";

export class WynncraftApiError extends Error {
  status: number;
  retryAfter: number | null;

  constructor(message: string, status = 502, retryAfter: number | null = null) {
    super(message);
    this.name = "WynncraftApiError";
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

export interface RequestOptions {
  fetcher?: typeof fetch;
  token?: string | null;
  timeoutMs?: number;
}

function retrySeconds(response: Response): number | null {
  const value = response.headers.get("retry-after") ?? response.headers.get("ratelimit-reset");
  if (!value) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.ceil(numeric)) : null;
}

async function upstreamMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.clone().json()) as { error?: unknown; message?: unknown };
    if (typeof payload.message === "string") return payload.message;
    if (typeof payload.error === "string") return payload.error;
  } catch {
    // Fall through to the status text when the body is not JSON.
  }
  return response.statusText || "Wynncraft request failed";
}

async function makeRequest(
  path: string,
  fetcher: typeof fetch,
  token: string | null,
  timeoutMs: number,
): Promise<Response> {
  const headers: HeadersInit = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  return fetcher(`${API_BASE}${path}`, {
    headers,
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });
}

export async function requestWynncraft<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const fetcher = options.fetcher ?? fetch;
  const configuredToken = options.token === undefined
    ? process.env.WYNNCRAFT_API_TOKEN?.trim() || null
    : options.token?.trim() || null;
  const timeoutMs = options.timeoutMs ?? 10_000;

  try {
    let response = await makeRequest(path, fetcher, configuredToken, timeoutMs);

    if (configuredToken && (response.status === 401 || response.status === 403)) {
      console.warn("Configured Wynncraft API token was rejected; retrying anonymously.");
      response = await makeRequest(path, fetcher, null, timeoutMs);
    }

    if (!response.ok) {
      throw new WynncraftApiError(
        await upstreamMessage(response),
        response.status,
        retrySeconds(response),
      );
    }

    try {
      return (await response.json()) as T;
    } catch {
      throw new WynncraftApiError("Wynncraft returned invalid JSON", 502);
    }
  } catch (error) {
    if (error instanceof WynncraftApiError) throw error;
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      throw new WynncraftApiError("Wynncraft took too long to respond", 504);
    }
    throw new WynncraftApiError("Could not reach the Wynncraft API", 502);
  }
}
