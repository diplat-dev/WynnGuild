import { describe, expect, it, vi } from "vitest";
import { requestWynncraft, WynncraftApiError } from "@/lib/server/request";

describe("Wynncraft request client", () => {
  it("sends the optional bearer token only on the server request", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    await requestWynncraft("/guild/list/guild", { fetcher, token: "secret-token" });

    const init = fetcher.mock.calls[0]?.[1];
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer secret-token");
  });

  it("retries anonymously after a rejected configured token", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("{}", { status: 401, statusText: "Unauthorized" }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    const result = await requestWynncraft<{ ok: boolean }>("/guild/example", {
      fetcher,
      token: "bad-token",
    });

    expect(result.ok).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(new Headers(fetcher.mock.calls[1]?.[1]?.headers).has("Authorization")).toBe(false);
    expect(warning).toHaveBeenCalledOnce();
    warning.mockRestore();
  });

  it("preserves rate-limit retry timing", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ error: "Slow down" }), {
        status: 429,
        headers: { "RateLimit-Reset": "17" },
      }),
    );

    await expect(requestWynncraft("/guild/example", { fetcher, token: null }))
      .rejects.toMatchObject<WynncraftApiError>({ status: 429, retryAfter: 17 });
  });
});
