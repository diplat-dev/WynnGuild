import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/server/response";
import { getGuildByUuid } from "@/lib/server/wynncraft";
import type { ApiErrorPayload } from "@/lib/types";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ uuid: string }> },
) {
  const { uuid } = await params;
  if (!UUID_PATTERN.test(uuid)) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Invalid guild identifier", code: "bad_request" },
      { status: 400 },
    );
  }

  try {
    const guild = await getGuildByUuid(uuid);
    return NextResponse.json(guild, {
      headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
