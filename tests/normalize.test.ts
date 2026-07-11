import { describe, expect, it } from "vitest";
import { normalizeGuild, normalizeGuildDirectory, PayloadError } from "@/lib/normalize";

describe("guild normalization", () => {
  it("normalizes directory records and skips malformed entries", () => {
    expect(normalizeGuildDirectory({
      Zebra: { uuid: "z-id", prefix: "ZBR" },
      Alpha: { uuid: "a-id", prefix: "ALP" },
      Broken: { prefix: "BAD" },
    })).toEqual([
      { uuid: "a-id", name: "Alpha", prefix: "ALP" },
      { uuid: "z-id", name: "Zebra", prefix: "ZBR" },
    ]);
  });

  it("aggregates roster and lifetime pace without requiring private member data", () => {
    const guild = normalizeGuild({
      uuid: "adb5f0b5-5289-439c-9293-a29d220e7152",
      name: "Test Guild",
      prefix: "TST",
      level: 42,
      xpPercent: 25,
      created: "2024-01-01T00:00:00.000Z",
      territories: 4,
      wars: 104,
      raids: 52,
      online: 2,
      members: {
        total: 4,
        owner: {
          One: { contributed: 1000, joined: "2024-01-01T00:00:00.000Z" },
        },
        recruit: {
          Two: { contributed: 500, joined: "2024-06-01T00:00:00.000Z" },
          Restricted: { contributed: 250 },
        },
      },
      ranking: { guildTotalRaids: 88, guildSeason9: 12 },
      seasonRanks: { "9": { rating: 3000, finalTerritories: 2 } },
      banner: { base: "BLUE", tier: 3, layers: [{ colour: "WHITE", pattern: "STRIPE" }] },
    }, new Date("2025-01-01T00:00:00.000Z"));

    expect(guild.members).toBe(4);
    expect(guild.onlinePercent).toBe(50);
    expect(guild.contributionTotal).toBe(1750);
    expect(guild.averageMemberTenureDays).toBeCloseTo((366 + 214) / 2);
    expect(guild.warsPerWeek).toBeCloseTo(104 / (366 / 7));
    expect(guild.raidsPerWeek).toBeCloseTo(52 / (366 / 7));
    expect(guild.totalRaidsRank).toBe(88);
    expect(guild.seasonRanks["9"]?.rank).toBe(12);
    expect(guild.banner?.base).toBe("BLUE");
  });

  it("uses a one-week floor for brand-new guild frequency", () => {
    const guild = normalizeGuild({
      uuid: "adb5f0b5-5289-439c-9293-a29d220e7152",
      name: "New Guild",
      prefix: "NEW",
      created: "2025-01-01T00:00:00.000Z",
      wars: 3,
      raids: 2,
    }, new Date("2025-01-02T00:00:00.000Z"));

    expect(guild.warsPerWeek).toBe(3);
    expect(guild.raidsPerWeek).toBe(2);
  });

  it("rejects payloads without stable identity fields", () => {
    expect(() => normalizeGuild({ name: "Missing fields" })).toThrow(PayloadError);
  });
});
