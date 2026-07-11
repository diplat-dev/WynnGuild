"use client";

import { Search, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { GuildSummary } from "@/lib/types";

export function rankGuilds(guilds: GuildSummary[], query: string, limit = 8): GuildSummary[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return [];

  return guilds
    .flatMap((guild) => {
      const name = guild.name.toLocaleLowerCase();
      const prefix = guild.prefix.toLocaleLowerCase();
      let score: number | null = null;
      if (name === needle) score = 0;
      else if (prefix === needle) score = 1;
      else if (name.startsWith(needle)) score = 2;
      else if (prefix.startsWith(needle)) score = 3;
      else if (name.includes(needle)) score = 4;
      else if (prefix.includes(needle)) score = 5;
      return score === null ? [] : [{ guild, score }];
    })
    .sort((a, b) => a.score - b.score || a.guild.name.localeCompare(b.guild.name))
    .slice(0, limit)
    .map(({ guild }) => guild);
}

interface GuildComboboxProps {
  label: string;
  accent: "cyan" | "amber";
  guilds: GuildSummary[];
  value: GuildSummary | null;
  loading?: boolean;
  disabled?: boolean;
  onSelect: (guild: GuildSummary) => void;
  onClear: () => void;
}

export function GuildCombobox({
  label,
  accent,
  guilds,
  value,
  loading = false,
  disabled = false,
  onSelect,
  onClear,
}: GuildComboboxProps) {
  const listId = useId();
  const [query, setQuery] = useState(value?.name ?? "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const typingClear = useRef(false);
  const previousUuid = useRef(value?.uuid ?? null);
  const matches = useMemo(() => rankGuilds(guilds, query), [guilds, query]);

  useEffect(() => {
    const uuid = value?.uuid ?? null;
    if (uuid !== previousUuid.current) {
      if (value) setQuery(value.name);
      else if (!typingClear.current) setQuery("");
      typingClear.current = false;
      previousUuid.current = uuid;
    }
  }, [value]);

  useEffect(() => setActiveIndex(0), [query]);

  function choose(guild: GuildSummary) {
    setQuery(guild.name);
    setOpen(false);
    onSelect(guild);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && matches.length) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index + 1) % matches.length);
    } else if (event.key === "ArrowUp" && matches.length) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index - 1 + matches.length) % matches.length);
    } else if (event.key === "Enter" && open && matches[activeIndex]) {
      event.preventDefault();
      choose(matches[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div
      className={`guild-picker guild-picker-${accent}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <label htmlFor={`${listId}-input`}>{label}</label>
      <div className="guild-picker-input-wrap">
        <Search aria-hidden="true" size={18} />
        <input
          id={`${listId}-input`}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open && matches.length > 0}
          aria-controls={listId}
          aria-activedescendant={open && matches[activeIndex] ? `${listId}-${activeIndex}` : undefined}
          autoComplete="off"
          disabled={disabled}
          placeholder={loading ? "Loading guild directory…" : "Search name or tag"}
          value={query}
          onFocus={() => setOpen(Boolean(query.trim()))}
          onChange={(event) => {
            if (value) {
              typingClear.current = true;
              onClear();
            }
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
        />
        {(query || value) && (
          <button
            className="clear-picker"
            type="button"
            aria-label={`Clear ${label}`}
            onClick={() => {
              setQuery("");
              setOpen(false);
              onClear();
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {open && query.trim() && (
        <div className="guild-options" id={listId} role="listbox">
          {matches.length ? (
            matches.map((guild, index) => (
              <button
                id={`${listId}-${index}`}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className={index === activeIndex ? "active" : undefined}
                key={guild.uuid}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(guild)}
              >
                <span>{guild.name}</span>
                <strong>{guild.prefix}</strong>
              </button>
            ))
          ) : (
            <p>No guilds match “{query}”</p>
          )}
        </div>
      )}
    </div>
  );
}
