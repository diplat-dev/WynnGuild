import type { GuildBanner, GuildSeasonRank, GuildStats, GuildSummary } from "@/lib/types";

const DAY_MS = 86_400_000;

export class PayloadError extends Error {
  constructor(message = "Wynncraft returned an unexpected response") {
    super(message);
    this.name = "PayloadError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function validDate(value: unknown): Date | null {
  const text = asString(value);
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseBanner(value: unknown): GuildBanner | null {
  if (!isRecord(value)) return null;
  const base = asString(value.base);
  if (!base) return null;
  const layers = Array.isArray(value.layers)
    ? value.layers.flatMap((layer) => {
        if (!isRecord(layer)) return [];
        const colour = asString(layer.colour);
        const pattern = asString(layer.pattern);
        return colour && pattern ? [{ colour, pattern }] : [];
      })
    : [];

  return {
    base,
    tier: asNumber(value.tier),
    structure: asString(value.structure),
    layers,
  };
}

function flattenMembers(value: unknown): Array<Record<string, unknown>> {
  if (!isRecord(value)) return [];
  const ranks = ["owner", "chief", "strategist", "captain", "recruiter", "recruit"];
  return ranks.flatMap((rank) => {
    const group = value[rank];
    if (!isRecord(group)) return [];
    return Object.values(group).filter(isRecord);
  });
}

function parseRankings(value: unknown): Record<string, number> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, rank]) => {
      const numericRank = asNumber(rank);
      return numericRank === null ? [] : [[key, numericRank]];
    }),
  );
}

function parseSeasons(
  value: unknown,
  rankings: Record<string, number>,
): Record<string, GuildSeasonRank> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).flatMap(([season, entry]) => {
      if (!isRecord(entry)) return [];
      return [
        [
          season,
          {
            rating: asNumber(entry.rating),
            finalTerritories: asNumber(entry.finalTerritories),
            rank: rankings[`guildSeason${season}`] ?? null,
          },
        ],
      ];
    }),
  );
}

export function normalizeGuildDirectory(payload: unknown): GuildSummary[] {
  if (!isRecord(payload)) throw new PayloadError();

  return Object.entries(payload)
    .flatMap(([name, entry]) => {
      if (!isRecord(entry)) return [];
      const uuid = asString(entry.uuid);
      const prefix = asString(entry.prefix);
      if (!uuid || !prefix) return [];
      return [{ uuid, name, prefix }];
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function normalizeGuild(payload: unknown, now = new Date()): GuildStats {
  if (!isRecord(payload)) throw new PayloadError();

  const uuid = asString(payload.uuid);
  const name = asString(payload.name);
  const prefix = asString(payload.prefix);
  const createdDate = validDate(payload.created);
  if (!uuid || !name || !prefix || !createdDate) throw new PayloadError();

  const rawMembers = isRecord(payload.members) ? payload.members : null;
  const memberObjects = flattenMembers(payload.members);
  const reportedMembers = rawMembers ? asNumber(rawMembers.total) : null;
  const members = reportedMembers ?? (memberObjects.length ? memberObjects.length : null);

  const contributions = memberObjects
    .map((member) => asNumber(member.contributed))
    .filter((value): value is number => value !== null);
  const contributionTotal = contributions.length
    ? contributions.reduce((total, value) => total + value, 0)
    : null;

  const tenures = memberObjects.flatMap((member) => {
    const joined = validDate(member.joined);
    return joined ? [Math.max(0, (now.getTime() - joined.getTime()) / DAY_MS)] : [];
  });
  const averageMemberTenureDays = tenures.length
    ? tenures.reduce((total, value) => total + value, 0) / tenures.length
    : null;

  const ageDays = Math.max(0, (now.getTime() - createdDate.getTime()) / DAY_MS);
  const weeks = Math.max(ageDays / 7, 1);
  const wars = asNumber(payload.wars);
  const raids = asNumber(payload.raids);
  const online = asNumber(payload.online);
  const rankings = parseRankings(payload.ranking);

  return {
    uuid,
    name,
    prefix,
    level: asNumber(payload.level),
    xpPercent: asNumber(payload.xpPercent),
    created: createdDate.toISOString(),
    ageDays,
    territories: asNumber(payload.territories),
    wars,
    raids,
    members,
    online,
    onlinePercent: online !== null && members ? (online / members) * 100 : null,
    contributionTotal,
    averageMemberTenureDays,
    warsPerWeek: wars === null ? null : wars / weeks,
    raidsPerWeek: raids === null ? null : raids / weeks,
    totalRaidsRank: rankings.guildTotalRaids ?? null,
    banner: parseBanner(payload.banner),
    seasonRanks: parseSeasons(payload.seasonRanks, rankings),
  };
}
