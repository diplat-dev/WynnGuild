import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GuildCombobox, rankGuilds } from "@/components/guild-combobox";

const guilds = [
  { uuid: "1", name: "The Aquarium", prefix: "TAq" },
  { uuid: "2", name: "Avicia", prefix: "AVO" },
  { uuid: "3", name: "Spectral Cabbage", prefix: "SPC" },
];

describe("guild autocomplete", () => {
  it("ranks exact tags before partial names", () => {
    expect(rankGuilds(guilds, "AVO").map((guild) => guild.name)).toEqual(["Avicia"]);
    expect(rankGuilds(guilds, "a").map((guild) => guild.name)).toEqual([
      "Avicia",
      "Spectral Cabbage",
      "The Aquarium",
    ]);
  });

  it("supports keyboard selection", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <GuildCombobox
        label="First guild"
        accent="cyan"
        guilds={guilds}
        value={null}
        onSelect={onSelect}
        onClear={() => undefined}
      />,
    );

    const input = screen.getByRole("combobox", { name: "First guild" });
    await user.type(input, "spectral");
    expect(screen.getByRole("option", { name: /Spectral Cabbage/ })).toBeVisible();
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith(guilds[2]);
  });
});
