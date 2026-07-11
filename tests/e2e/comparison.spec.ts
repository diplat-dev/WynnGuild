import { expect, test } from "@playwright/test";
import type { GuildStats } from "@/lib/types";

const directory = [
  { uuid: "11111111-1111-4111-8111-111111111111", name: "Alpha Guild", prefix: "ALP" },
  { uuid: "22222222-2222-4222-8222-222222222222", name: "Beta Guild", prefix: "BET" },
];

function guild(index: 0 | 1): GuildStats {
  const summary = directory[index];
  return {
    ...summary,
    level: index ? 60 : 70,
    xpPercent: index ? 30 : 50,
    created: "2020-01-01T00:00:00.000Z",
    ageDays: 2000,
    territories: index ? 4 : 8,
    wars: index ? 100 : 200,
    raids: index ? 20 : 40,
    members: index ? 30 : 50,
    online: index ? 2 : 5,
    onlinePercent: index ? 6.7 : 10,
    contributionTotal: index ? 500_000 : 1_000_000,
    averageMemberTenureDays: index ? 200 : 400,
    warsPerWeek: index ? 0.35 : 0.7,
    raidsPerWeek: index ? 0.07 : 0.14,
    totalRaidsRank: index ? 40 : 20,
    banner: null,
    seasonRanks: {},
  };
}

test("selects two guilds and renders a shareable comparison", async ({ page }) => {
  await page.route(/\/api\/guilds$/, (route) => route.fulfill({ json: directory }));
  await page.route(/\/api\/guilds\/([^/]+)$/, (route) => {
    const uuid = route.request().url().split("/").at(-1);
    return route.fulfill({ json: guild(uuid === directory[0].uuid ? 0 : 1) });
  });

  await page.goto("/");
  await page.getByRole("combobox", { name: "First guild" }).fill("Alpha");
  await page.getByRole("option", { name: /Alpha Guild/ }).click();
  await page.getByRole("combobox", { name: "Second guild" }).fill("Beta");
  await page.getByRole("option", { name: /Beta Guild/ }).click();

  await expect(page).toHaveURL(/left=.*right=.*/);
  await expect(page.getByRole("heading", { name: "Guild profile" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Detailed comparison" })).toBeVisible();
  await expect(page.getByText("Wars per week")).toBeVisible();
  await page.screenshot({ path: test.info().outputPath("comparison.png"), fullPage: true });
});
