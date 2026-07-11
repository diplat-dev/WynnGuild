import { NextResponse } from "next/server";
import type { ApiErrorPayload } from "@/lib/types";
import { WynncraftApiError } from "@/lib/server/request";

export function apiErrorResponse(error: unknown): NextResponse<ApiErrorPayload> {
  if (error instanceof WynncraftApiError) {
    const status = error.status === 404
      ? 404
      : error.status === 429
        ? 429
        : error.status === 504
          ? 504
          : 502;
    const code: ApiErrorPayload["code"] = status === 404
      ? "not_found"
      : status === 429
        ? "rate_limited"
        : status === 504
          ? "timeout"
          : "upstream_error";
    const body: ApiErrorPayload = {
      error: status === 404 ? "Guild not found" : error.message,
      code,
      ...(error.retryAfter !== null ? { retryAfter: error.retryAfter } : {}),
    };
    return NextResponse.json(body, {
      status,
      headers: error.retryAfter !== null ? { "Retry-After": String(error.retryAfter) } : undefined,
    });
  }

  console.error("Unexpected guild API error", error);
  return NextResponse.json(
    { error: "Unexpected server error", code: "upstream_error" },
    { status: 500 },
  );
}
