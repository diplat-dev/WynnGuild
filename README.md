# Wynn Guild Compare



 responsive Next.js dashboard for comparing any two Wynncraft guilds across progression, roster, activity, territories, and rankings.



## Features



- Accessible guild-name and tag autocomplete backed by the official guild directory

- Shareable comparisons through `left` and `right` URL parameters

- Guild banners, level progress, roster metrics, and lifetime activity rates

- Pair-normalized radar chart with raw-value tooltips

- Signed green/red differences with non-color directional indicators

- Responsive desktop and mobile layouts

- Optional server-only Wynncraft API token for higher rate limits

- Cached, normalized server routes that never send raw member payloads to the browser



## Run locally



The only host-level prerequisite is [Pixi](https://pixi.sh/). Pixi installs the pinned Node.js and pnpm toolchain and provides every project command.



```powershell

pixi install

pixi run dev

```



Open [http://localhost:3000](http://localhost:3000). The first task invocation installs the locked JavaScript dependencies automatically.



## Optional Wynncraft API token



Anonymous requests work by default. To use Wynncraft's higher authenticated rate limits, provide a public-mode token as the server-only `WYNNCRAFT_API_TOKEN` environment variable.



PowerShell:



```powershell

$env:WYNNCRAFT_API_TOKEN="your-token"

pixi run dev

```



Bash/Zsh:



```bash

export WYNNCRAFT_API_TOKEN="your-token"

pixi run dev

```



You can instead copy `.env.example` to `.env.local` and fill in the value. Never rename it with a `NEXT_PUBLIC_` prefix. The token is only read by the server API client. If Wynncraft rejects a configured token, the request retries once anonymously and logs a credential-free warning.



For Vercel or another host, configure `WYNNCRAFT_API_TOKEN` as a server environment variable. The app does not require a token to deploy.



## Commands



| Command | Purpose |

| --- | --- |

| `pixi run dev` | Start the development server |

| `pixi run build` | Create a production build |

| `pixi run start` | Serve the production build |

| `pixi run lint` | Run ESLint |

| `pixi run test` | Run Vitest unit and component tests |

| `pixi run e2e` | Run desktop and mobile Playwright tests |



Both lockfiles are intentional: `pixi.lock` pins the cross-platform runtime/tool environment, while `pnpm-lock.yaml` pins the npm dependency graph. All commands still enter through Pixi.



## Architecture and data handling



- `GET /api/guilds` proxies the public guild directory and caches it for one hour.

- `GET /api/guilds/[uuid]` fetches a guild by stable UUID, normalizes the payload, calculates safe roster aggregates, and caches it for two minutes.

- Raw member payloads and API credentials are never sent to the browser.

- Wars/week and raids/week are lifetime averages derived from the guild creation date. Wynncraft does not expose historical guild activity snapshots.

- Radar axes are normalized pairwise for shape comparison, while tooltips and the detailed table retain raw values.

