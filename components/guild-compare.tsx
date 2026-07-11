"use client";

import { ArrowLeftRight, BarChart3, Radio, RefreshCw, Shield, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ComparisonTable } from "@/components/comparison-table";
import { GuildCard } from "@/components/guild-card";
import { GuildCombobox } from "@/components/guild-combobox";
import { RadarComparison } from "@/components/radar-comparison";
import type { ApiErrorPayload, GuildStats, GuildSummary } from "@/lib/types";

interface LoadState {
  guild: GuildStats | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

async function responseError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as ApiErrorPayload;
    if (payload.code === "rate_limited" && payload.retryAfter) {
      return `${payload.error}. Try again in ${payload.retryAfter}s.`;
    }
    return payload.error;
  } catch {
    return "The guild service returned an unexpected response.";
  }
}

function useGuild(uuid: string | null): LoadState {
  const [guild, setGuild] = useState<GuildStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!uuid) {
      setGuild(null);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setGuild(null);

    void fetch(`/api/guilds/${encodeURIComponent(uuid)}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(await responseError(response));
        return response.json() as Promise<GuildStats>;
      })
      .then((payload) => {
        setGuild(payload);
        setLoading(false);
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return;
        setError(caught instanceof Error ? caught.message : "Could not load this guild.");
        setLoading(false);
      });

    return () => controller.abort();
  }, [uuid, attempt]);

  return {
    guild,
    loading,
    error,
    retry: () => setAttempt((value) => value + 1),
  };
}

export function GuildCompare() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const leftUuid = searchParams.get("left");
  const rightUuid = searchParams.get("right");
  const leftState = useGuild(leftUuid);
  const rightState = useGuild(rightUuid);
  const [guilds, setGuilds] = useState<GuildSummary[]>([]);
  const [directoryLoading, setDirectoryLoading] = useState(true);
  const [directoryError, setDirectoryError] = useState<string | null>(null);
  const [directoryAttempt, setDirectoryAttempt] = useState(0);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setDirectoryLoading(true);
    setDirectoryError(null);

    void fetch("/api/guilds", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(await responseError(response));
        return response.json() as Promise<GuildSummary[]>;
      })
      .then((payload) => {
        setGuilds(payload);
        setDirectoryLoading(false);
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return;
        setDirectoryError(caught instanceof Error ? caught.message : "Could not load the guild directory.");
        setDirectoryLoading(false);
      });

    return () => controller.abort();
  }, [directoryAttempt]);

  const updateSelection = useCallback((side: "left" | "right", uuid: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (uuid) params.set(side, uuid);
    else params.delete(side);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    setSelectionError(null);
  }, [pathname, router, searchParams]);

  const selectGuild = useCallback((side: "left" | "right", guild: GuildSummary) => {
    const other = side === "left" ? rightUuid : leftUuid;
    if (guild.uuid === other) {
      setSelectionError("Choose two different guilds to create a comparison.");
      return;
    }
    updateSelection(side, guild.uuid);
  }, [leftUuid, rightUuid, updateSelection]);

  const swapGuilds = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (rightUuid) params.set("left", rightUuid);
    else params.delete("left");
    if (leftUuid) params.set("right", leftUuid);
    else params.delete("right");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    setSelectionError(null);
  }, [leftUuid, pathname, rightUuid, router, searchParams]);

  const leftSummary = useMemo(() => {
    if (leftState.guild) {
      return { uuid: leftState.guild.uuid, name: leftState.guild.name, prefix: leftState.guild.prefix };
    }
    return guilds.find((guild) => guild.uuid === leftUuid) ?? null;
  }, [guilds, leftState.guild, leftUuid]);

  const rightSummary = useMemo(() => {
    if (rightState.guild) {
      return { uuid: rightState.guild.uuid, name: rightState.guild.name, prefix: rightState.guild.prefix };
    }
    return guilds.find((guild) => guild.uuid === rightUuid) ?? null;
  }, [guilds, rightState.guild, rightUuid]);

  const ready = Boolean(leftState.guild && rightState.guild);

  return (
    <>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Wynn Guild Compare home">
          <span className="brand-mark"><Shield size={18} /></span>
          <span>WYNN<span>COMPARE</span></span>
        </a>
        <div className="api-status"><Radio size={12} /> Live Wynncraft data</div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-kicker"><Sparkles size={14} /> Guild intelligence, side by side</div>
          <h1>See how any two<br /><span>Wynncraft guilds</span> stack up.</h1>
          <p>
            Compare progression, roster strength, activity, and competitive performance
            using current data from the Wynncraft API.
          </p>
        </section>

        <section className="picker-panel" aria-label="Choose guilds to compare">
          <GuildCombobox
            label="First guild"
            accent="cyan"
            guilds={guilds}
            value={leftSummary}
            loading={directoryLoading}
            disabled={directoryLoading || Boolean(directoryError)}
            onSelect={(guild) => selectGuild("left", guild)}
            onClear={() => updateSelection("left", null)}
          />
          <button
            className="swap-button"
            type="button"
            aria-label="Swap selected guilds"
            disabled={!leftUuid && !rightUuid}
            onClick={swapGuilds}
          >
            <ArrowLeftRight size={18} />
          </button>
          <GuildCombobox
            label="Second guild"
            accent="amber"
            guilds={guilds}
            value={rightSummary}
            loading={directoryLoading}
            disabled={directoryLoading || Boolean(directoryError)}
            onSelect={(guild) => selectGuild("right", guild)}
            onClear={() => updateSelection("right", null)}
          />
        </section>

        {(directoryError || selectionError) && (
          <div className="inline-alert" role="alert">
            <span>{directoryError ?? selectionError}</span>
            {directoryError && (
              <button type="button" onClick={() => setDirectoryAttempt((value) => value + 1)}>
                <RefreshCw size={14} /> Retry directory
              </button>
            )}
          </div>
        )}

        <section className="guild-card-grid" aria-label="Selected guilds">
          <GuildCard
            side="left"
            selected={Boolean(leftUuid)}
            guild={leftState.guild}
            loading={leftState.loading}
            error={leftState.error}
            onRetry={leftState.retry}
          />
          <div className="versus-mark"><span>VS</span></div>
          <GuildCard
            side="right"
            selected={Boolean(rightUuid)}
            guild={rightState.guild}
            loading={rightState.loading}
            error={rightState.error}
            onRetry={rightState.retry}
          />
        </section>

        {ready && leftState.guild && rightState.guild ? (
          <div className="results-stack">
            <RadarComparison left={leftState.guild} right={rightState.guild} />
            <ComparisonTable left={leftState.guild} right={rightState.guild} />
          </div>
        ) : (
          <section className="waiting-panel">
            <div className="waiting-icon"><BarChart3 size={26} /></div>
            <div>
              <h2>{leftUuid || rightUuid ? "Pick the other contender" : "Your comparison will appear here"}</h2>
              <p>
                {leftUuid || rightUuid
                  ? "Select a second guild to unlock the radar profile and full metric breakdown."
                  : "Search for two guilds above to reveal their strengths, gaps, and activity pace."}
              </p>
            </div>
          </section>
        )}
      </main>

      <footer>
        <span>WYNNCOMPARE</span>
        <p>Independent community tool · Data provided by the Wynncraft API</p>
      </footer>
    </>
  );
}
