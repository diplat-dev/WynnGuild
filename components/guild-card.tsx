import { AlertCircle, CalendarDays, RefreshCw, Users } from "lucide-react";
import type { CSSProperties } from "react";
import type { GuildStats } from "@/lib/types";

const BANNER_COLOURS: Record<string, string> = {
  BLACK: "#1d2028",
  BLUE: "#3156c7",
  BROWN: "#815631",
  CYAN: "#21a6b9",
  GRAY: "#6b7280",
  GREEN: "#299268",
  LIGHT_BLUE: "#4fc3f7",
  LIGHT_GRAY: "#cbd5e1",
  LIME: "#84cc16",
  MAGENTA: "#d946ef",
  ORANGE: "#f97316",
  PINK: "#f472b6",
  PURPLE: "#7c3aed",
  RED: "#dc3f50",
  WHITE: "#f8fafc",
  YELLOW: "#facc15",
};

function bannerStyle(guild: GuildStats): CSSProperties {
  const colours = [
    BANNER_COLOURS[guild.banner?.base ?? ""] ?? "#334155",
    ...((guild.banner?.layers ?? []).map((layer) => BANNER_COLOURS[layer.colour] ?? "#64748b")),
  ];
  return {
    "--banner-base": colours[0],
    "--banner-one": colours[1] ?? colours[0],
    "--banner-two": colours[2] ?? colours[1] ?? colours[0],
    "--banner-three": colours[3] ?? colours[2] ?? colours[0],
  } as CSSProperties;
}

interface GuildCardProps {
  side: "left" | "right";
  guild: GuildStats | null;
  selected: boolean;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function GuildCard({ side, guild, selected, loading, error, onRetry }: GuildCardProps) {
  if (!selected) {
    return (
      <article className={`guild-card guild-card-${side} empty-card`}>
        <div className="empty-emblem">{side === "left" ? "01" : "02"}</div>
        <div>
          <p className="eyebrow">{side} guild</p>
          <h2>Choose a guild</h2>
          <p>Use the search above to fill this side.</p>
        </div>
      </article>
    );
  }

  if (loading) {
    return (
      <article className={`guild-card guild-card-${side} loading-card`} aria-label="Loading guild">
        <span className="skeleton skeleton-emblem" />
        <div className="skeleton-stack">
          <span className="skeleton skeleton-small" />
          <span className="skeleton skeleton-title" />
          <span className="skeleton skeleton-line" />
        </div>
      </article>
    );
  }

  if (error || !guild) {
    return (
      <article className={`guild-card guild-card-${side} error-card`}>
        <AlertCircle aria-hidden="true" />
        <div>
          <p className="eyebrow">Could not load guild</p>
          <h2>{error ?? "Unknown error"}</h2>
          <button type="button" onClick={onRetry}>
            <RefreshCw size={15} /> Retry
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className={`guild-card guild-card-${side}`}>
      <div className="guild-banner" style={bannerStyle(guild)} aria-label={`${guild.name} banner`}>
        <span>{guild.prefix.slice(0, 3)}</span>
      </div>
      <div className="guild-card-content">
        <div className="guild-card-heading">
          <div>
            <p className="eyebrow">{side} guild · {guild.prefix}</p>
            <h2>{guild.name}</h2>
          </div>
          <div className="level-pill">
            <span>Level</span>
            <strong>{guild.level ?? "—"}</strong>
          </div>
        </div>

        <div className="level-progress-copy">
          <span>Next level</span>
          <strong>{guild.xpPercent === null ? "Unavailable" : `${guild.xpPercent}%`}</strong>
        </div>
        <div className="level-progress" aria-label={`${guild.xpPercent ?? 0}% to next level`}>
          <span style={{ width: `${Math.min(100, Math.max(0, guild.xpPercent ?? 0))}%` }} />
        </div>

        <div className="guild-card-meta">
          <span><Users size={15} /> {guild.members ?? "—"} members</span>
          <span>
            <CalendarDays size={15} /> Founded {new Intl.DateTimeFormat("en-US", {
              year: "numeric",
              month: "short",
            }).format(new Date(guild.created))}
          </span>
        </div>
      </div>
    </article>
  );
}
