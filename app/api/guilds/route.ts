import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/server/response";
import { getGuildDirectory } from "@/lib/server/wynncraft";

export async function GET() {
  try {
    const guilds = await getGuildDirectory();
    return NextResponse.json(guilds, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
