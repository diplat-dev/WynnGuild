import { describe, expect, it } from "vitest";
import {
  buildComparisonRows,
  buildRadarData,
  formatMetricDelta,
  metricOutcome,
} from "@/lib/metrics";
import type { GuildStats } from "@/lib/types";

function guild(overrides: Partial<GuildStats> = {}): GuildStats {
  return {
    uuid: "adb5f0b5-5289-439c-9293-a29d220e7152",
    name: "Guild",
    prefix: "GLD",
    level: 50,
    xpPercent: 40,
    created: "2020-01-01T00:00:00.000Z",
    ageDays: 1000,
    territories: 10,
    wars: 100,
    raids: 20,
    members: 40,
    online: 4,
    onlinePercent: 10,
    contributionTotal: 1_000_000,
    averageMemberTenureDays: 300,
    warsPerWeek: 0.7,
    raidsPerWeek: 0.14,
    totalRaidsRank: 25,
    banner: null,
    seasonRanks: {},
    ...overrides,
  };
}

describe("comparison metrics", () => {
  it("treats lower leaderboard rank as better", () => {
    const rows = buildComparisonRows(guild({ totalRaidsRank: 10 }), guild({ totalRaidsRank: 30 }));
    const rank = rows.find((row) => row.id === "raid-rank");
    expect(rank).toBeDefined();
    expect(metricOutcome(rank!)).toBe("left");
    expect(formatMetricDelta(rank!)).toBe("+20 places");
  });

  it("keeps XP progress neutral when levels differ", () => {
    const rows = buildComparisonRows(guild({ level: 70, xpPercent: 1 }), guild({ level: 69, xpPercent: 99 }));
    const progress = rows.find((row) => row.id === "level-progress");
    expect(progress?.direction).toBe("neutral");
    expect(metricOutcome(progress!)).toBe("neutral");
  });

  it("adds only the latest season shared by both guilds", () => {
    const left = guild({
      seasonRanks: {
        "10": { rating: 100, finalTerritories: 1, rank: 20 },
        "12": { rating: 200, finalTerritories: 2, rank: 10 },
      },
    });
    const right = guild({
      seasonRanks: {
        "10": { rating: 300, finalTerritories: 3, rank: 5 },
        "11": { rating: 400, finalTerritories: 4, rank: 4 },
      },
    });
    const ids = buildComparisonRows(left, right).map((row) => row.id);
    expect(ids).toContain("season-10-rating");
    expect(ids).not.toContain("season-11-rating");
    expect(ids).not.toContain("season-12-rating");
  });

  it("normalizes each radar axis pairwise and preserves raw labels", () => {
    const data = buildRadarData(
      guild({ wars: 50, territories: 0 }),
      guild({ wars: 100, territories: 0 }),
    );
    const wars = data.find((entry) => entry.metric === "Wars");
    const territories = data.find((entry) => entry.metric === "Territories");
    expect(wars).toMatchObject({ left: 50, right: 100, leftRaw: 50, rightRaw: 100 });
    expect(territories).toMatchObject({ left: 0, right: 0 });
    expect(wars?.leftDisplay).toBe("50");
  });
});
