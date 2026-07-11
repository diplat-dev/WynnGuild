import { unstable_cache } from "next/cache";
import { normalizeGuild, normalizeGuildDirectory, PayloadError } from "@/lib/normalize";
import { requestWynncraft, WynncraftApiError } from "@/lib/server/request";
import type { GuildStats, GuildSummary } from "@/lib/types";

async function fetchDirectory(): Promise<GuildSummary[]> {
  const payload = await requestWynncraft<unknown>("/guild/list/guild");
  try {
    return normalizeGuildDirectory(payload);
  } catch (error) {
    if (error instanceof PayloadError) {
      throw new WynncraftApiError(error.message, 502);
    }
    throw error;
  }
}

async function fetchGuild(uuid: string): Promise<GuildStats> {
  const payload = await requestWynncraft<unknown>(
    `/guild/uuid/${encodeURIComponent(uuid)}?identifier=username`,
  );
  try {
    return normalizeGuild(payload);
  } catch (error) {
    if (error instanceof PayloadError) {
      throw new WynncraftApiError(error.message, 502);
    }
    throw error;
  }
}

export const getGuildDirectory = unstable_cache(fetchDirectory, ["wynncraft-guild-directory-v1"], {
  revalidate: 3600,
  tags: ["guild-directory"],
});

export const getGuildByUuid = unstable_cache(fetchGuild, ["wynncraft-guild-v1"], {
  revalidate: 120,
  tags: ["guild-detail"],
});
