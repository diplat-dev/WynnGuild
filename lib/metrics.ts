import type { GuildStats } from "@/lib/types";

export type MetricCategory = "Growth" | "Roster" | "Activity" | "Competition";
export type MetricDirection = "higher" | "lower" | "neutral";
export type MetricFormat = "integer" | "percent" | "compact" | "days" | "rate" | "rank" | "rating";

export interface ComparisonRow {
  id: string;
  label: string;
  description: string;
  category: MetricCategory;
  left: number | null;
  right: number | null;
  direction: MetricDirection;
  format: MetricFormat;
  missingLabel?: string;
}

export interface RadarDatum {
  metric: string;
  left: number;
  right: number;
  leftRaw: number | null;
  rightRaw: number | null;
  leftDisplay: string;
  rightDisplay: string;
}

const numberFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatDuration(days: number): string {
  if (days < 31) return `${Math.max(0, Math.round(days))}d`;
  if (days < 365.2425) return `${Math.round(days / 30.4375)}mo`;
  const years = Math.floor(days / 365.2425);
  const months = Math.floor((days - years * 365.2425) / 30.4375);
  return months ? `${years}y ${months}mo` : `${years}y`;
}

export function formatMetricValue(row: ComparisonRow, value: number | null): string {
  if (value === null) return row.missingLabel ?? "Unavailable";
  switch (row.format) {
    case "percent":
      return `${value.toFixed(value < 10 && value % 1 ? 1 : 0)}%`;
    case "compact":
      return compactFormatter.format(value);
    case "days":
      return formatDuration(value);
    case "rate":
      return `${value.toFixed(value < 1 ? 2 : 1)}/wk`;
    case "rank":
      return `#${numberFormatter.format(value)}`;
    case "rating":
    case "integer":
    default:
      return numberFormatter.format(value);
  }
}

export function metricAdvantage(row: ComparisonRow): number | null {
  if (row.direction === "neutral" || row.left === null || row.right === null) return null;
  const raw = row.left - row.right;
  return row.direction === "higher" ? raw : -raw;
}

export function metricOutcome(row: ComparisonRow): "left" | "right" | "tie" | "neutral" {
  const advantage = metricAdvantage(row);
  if (advantage === null) return "neutral";
  if (Math.abs(advantage) < Number.EPSILON) return "tie";
  return advantage > 0 ? "left" : "right";
}

export function formatMetricDelta(row: ComparisonRow): string {
  const advantage = metricAdvantage(row);
  if (advantage === null) return "—";
  if (Math.abs(advantage) < Number.EPSILON) return "Even";
  const sign = advantage > 0 ? "+" : "−";
  const amount = Math.abs(advantage);
  switch (row.format) {
    case "percent":
      return `${sign}${amount.toFixed(amount < 10 && amount % 1 ? 1 : 0)} pp`;
    case "compact":
      return `${sign}${compactFormatter.format(amount)}`;
    case "days":
      return `${sign}${formatDuration(amount)}`;
    case "rate":
      return `${sign}${amount.toFixed(amount < 1 ? 2 : 1)}/wk`;
    case "rank":
      return `${sign}${numberFormatter.format(amount)} places`;
    default:
      return `${sign}${numberFormatter.format(amount)}`;
  }
}

function commonLatestSeason(left: GuildStats, right: GuildStats): string | null {
  const common = Object.keys(left.seasonRanks).filter((season) => season in right.seasonRanks);
  if (!common.length) return null;
  return common.sort((a, b) => Number(b) - Number(a))[0] ?? null;
}

export function buildComparisonRows(left: GuildStats, right: GuildStats): ComparisonRow[] {
  const rows: ComparisonRow[] = [
    {
      id: "level",
      label: "Guild level",
      description: "The guild's current progression level.",
      category: "Growth",
      left: left.level,
      right: right.level,
      direction: "higher",
      format: "integer",
    },
    {
      id: "level-progress",
      label: "Level progress",
      description: left.level === right.level
        ? "Progress toward the next guild level."
        : "Progress is neutral because the guild levels differ.",
      category: "Growth",
      left: left.xpPercent,
      right: right.xpPercent,
      direction: left.level === right.level ? "higher" : "neutral",
      format: "percent",
    },
    {
      id: "age",
      label: "Guild age",
      description: "Time since the guild was founded; shown as context, not an advantage.",
      category: "Growth",
      left: left.ageDays,
      right: right.ageDays,
      direction: "neutral",
      format: "days",
    },
    {
      id: "members",
      label: "Members",
      description: "Current guild roster size.",
      category: "Roster",
      left: left.members,
      right: right.members,
      direction: "higher",
      format: "integer",
    },
    {
      id: "online",
      label: "Online now",
      description: "Members currently visible as online.",
      category: "Roster",
      left: left.online,
      right: right.online,
      direction: "higher",
      format: "integer",
    },
    {
      id: "online-percent",
      label: "Online share",
      description: "Online members as a percentage of the roster.",
      category: "Roster",
      left: left.onlinePercent,
      right: right.onlinePercent,
      direction: "higher",
      format: "percent",
    },
    {
      id: "contribution",
      label: "Roster contribution",
      description: "Combined guild XP contributions from current members.",
      category: "Roster",
      left: left.contributionTotal,
      right: right.contributionTotal,
      direction: "higher",
      format: "compact",
    },
    {
      id: "tenure",
      label: "Average tenure",
      description: "Average time current members have belonged to the guild.",
      category: "Roster",
      left: left.averageMemberTenureDays,
      right: right.averageMemberTenureDays,
      direction: "higher",
      format: "days",
    },
    {
      id: "wars",
      label: "Total wars",
      description: "All recorded guild wars.",
      category: "Activity",
      left: left.wars,
      right: right.wars,
      direction: "higher",
      format: "integer",
    },
    {
      id: "wars-week",
      label: "Wars per week",
      description: "Lifetime average based on guild age.",
      category: "Activity",
      left: left.warsPerWeek,
      right: right.warsPerWeek,
      direction: "higher",
      format: "rate",
    },
    {
      id: "raids",
      label: "Total raids",
      description: "All recorded guild raids.",
      category: "Activity",
      left: left.raids,
      right: right.raids,
      direction: "higher",
      format: "integer",
    },
    {
      id: "raids-week",
      label: "Raids per week",
      description: "Lifetime average based on guild age.",
      category: "Activity",
      left: left.raidsPerWeek,
      right: right.raidsPerWeek,
      direction: "higher",
      format: "rate",
    },
    {
      id: "territories",
      label: "Territories",
      description: "Territories currently controlled by the guild.",
      category: "Competition",
      left: left.territories,
      right: right.territories,
      direction: "higher",
      format: "integer",
    },
    {
      id: "raid-rank",
      label: "Total raids rank",
      description: "Position on the all-time guild raids leaderboard; lower is better.",
      category: "Competition",
      left: left.totalRaidsRank,
      right: right.totalRaidsRank,
      direction: "lower",
      format: "rank",
      missingLabel: "Unranked",
    },
  ];

  const season = commonLatestSeason(left, right);
  if (season) {
    const leftSeason = left.seasonRanks[season];
    const rightSeason = right.seasonRanks[season];
    rows.push(
      {
        id: `season-${season}-rating`,
        label: `Season ${season} rating`,
        description: "Rating from the latest season in which both guilds are recorded.",
        category: "Competition",
        left: leftSeason?.rating ?? null,
        right: rightSeason?.rating ?? null,
        direction: "higher",
        format: "rating",
      },
      {
        id: `season-${season}-rank`,
        label: `Season ${season} rank`,
        description: "Leaderboard position for the latest shared season; lower is better.",
        category: "Competition",
        left: leftSeason?.rank ?? null,
        right: rightSeason?.rank ?? null,
        direction: "lower",
        format: "rank",
        missingLabel: "Unranked",
      },
    );
  }

  return rows;
}

function radarPair(
  metric: string,
  leftRaw: number | null,
  rightRaw: number | null,
  display: (value: number | null) => string,
): RadarDatum {
  const max = Math.max(leftRaw ?? 0, rightRaw ?? 0);
  return {
    metric,
    left: max > 0 && leftRaw !== null ? (leftRaw / max) * 100 : 0,
    right: max > 0 && rightRaw !== null ? (rightRaw / max) * 100 : 0,
    leftRaw,
    rightRaw,
    leftDisplay: display(leftRaw),
    rightDisplay: display(rightRaw),
  };
}

export function buildRadarData(left: GuildStats, right: GuildStats): RadarDatum[] {
  const number = (value: number | null) => value === null ? "Unavailable" : numberFormatter.format(value);
  const age = (value: number | null) => value === null ? "Unavailable" : formatDuration(value);
  return [
    radarPair("Age", left.ageDays, right.ageDays, age),
    radarPair("Level", left.level, right.level, number),
    radarPair("Territories", left.territories, right.territories, number),
    radarPair("Members", left.members, right.members, number),
    radarPair("Wars", left.wars, right.wars, number),
    radarPair("Raids", left.raids, right.raids, number),
  ];
}
