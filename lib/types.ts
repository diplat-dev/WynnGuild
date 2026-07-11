export interface GuildSummary {
  uuid: string;
  name: string;
  prefix: string;
}

export interface GuildBanner {
  base: string;
  tier: number | null;
  structure: string | null;
  layers: Array<{ colour: string; pattern: string }>;
}

export interface GuildSeasonRank {
  rating: number | null;
  finalTerritories: number | null;
  rank: number | null;
}

export interface GuildStats extends GuildSummary {
  level: number | null;
  xpPercent: number | null;
  created: string;
  ageDays: number;
  territories: number | null;
  wars: number | null;
  raids: number | null;
  members: number | null;
  online: number | null;
  onlinePercent: number | null;
  contributionTotal: number | null;
  averageMemberTenureDays: number | null;
  warsPerWeek: number | null;
  raidsPerWeek: number | null;
  totalRaidsRank: number | null;
  banner: GuildBanner | null;
  seasonRanks: Record<string, GuildSeasonRank>;
}

export interface ApiErrorPayload {
  error: string;
  code: "bad_request" | "not_found" | "rate_limited" | "upstream_error" | "timeout";
  retryAfter?: number;
}
