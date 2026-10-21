---
name: freellmapi
description: operational runbook for the local FreeLLMAPI LLM router — the server on 127.0.0.1:3001, cloned into ~/.config/opencode/freellmapi, that auto-seeds keyless providers (aihorde/kilo/ovh) via declarative config (FREEAPI_CONFIG_PATH), supplies a unified API key (FREELLMAPI_API_KEY, freellmapi- prefix), exposes dashboard APIs for auth and key import, and provides the freellmapi/auto model to opencode. Use when starting, debugging, or extending FreeLLMAPI; when freellmapi/auto fails (401/404/429); when adding provider keys (Groq, Cerebras, Google); or when the unified key or FREEAPI_CONFIG_PATH is lost. Not for the open-code-skills repo, or generic OpenAI client config.
license: MIT
---

# freellmapi

Runbook for the local FreeLLMAPI router on this machine: how it is wired into
opencode, what runs where, the dashboard API, and the traps that cost time.
Everything below was verified live on 2026-10-17; if an endpoint disagrees,
the server source under `~/.config/opencode/freellmapi/server/src/` is truth.

## Layout (what lives where)

| Path | What |
| --- | --- |
| `~/.config/opencode/freellmapi/` | git clone of github.com/tashfeenahmed/freellmapi (workspaces: server, cli, client) |
| `~/.config/opencode/freellmapi/server/data/freeapi.db` | SQLite state: keys, models, settings, sessions |
| `~/.config/opencode/freellmapi-integration/start-server.ps1` | idempotent server launcher (checks `/livez`, builds dist if missing, Start-Process hidden) |
| `~/.config/opencode/freellmapi-integration/bootstrap.ps1` | dashboard auth (setup/login), imports `provider-keys.env` via `/api/keys/import`, setx's the unified key |
| `~/.config/opencode/freellmapi-integration/config.json` | declarative boot config: keyless platforms (see below) |
| `~/.config/opencode/freellmapi-integration/provider-keys.env` | user's real provider keys (template: `provider-keys.env.example`) |
| `~/.config/opencode/freellmapi-integration/dashboard-creds.json` | dashboard account email+password created on first run |
| `~/.config/opencode/freellmapi-integration/logs/server-*.log` | server stdout/stderr |
| `~/.config/opencode/opencode.jsonc` | provider entry `freellmapi` with model `auto` |
| `scripts/status.js` (this skill) | health check: liveness, key source, providers, catalog count |

Run `node "~/.config/opencode/skills/freellmapi/scripts/status.js"` to get the
whole state in five lines. Exit 0 = healthy, 1 = server or key problem.

## How it is wired into opencode

- `opencode.jsonc` declares provider `freellmapi`:
  `npm: @ai-sdk/openai-compatible`, `baseURL: http://127.0.0.1:3001/v1`,
  `apiKey: {env:FREELLMAPI_API_KEY}`, model `auto`.
- To use it, the user selects model `freellmapi/auto` in opencode. The top-level
  `model` is intentionally NOT forced to freellmapi (user keeps their other
  providers as default).
- `FREELLMAPI_API_KEY` and `FREEAPI_CONFIG_PATH` are **user-level env vars**
  (set via `setx`). setx only reaches NEW processes — an already-running
  opencode does not see them; restart required after the first bootstrap.

## Keyless auto-seed (the "it pulls itself" part)

`config.json` is applied on **every boot** via `FREEAPI_CONFIG_PATH`
(`applyDeclarativeConfigFromEnv` in server `main()`):

```json
{ "keys": [ { "platform": "aihorde" }, { "platform": "kilo" }, { "platform": "ovh" } ] }
```

These platforms are `keyless: true` in the provider registry, so an entry with
no `key` stores the `no-key` sentinel and the router calls them anonymously.
Verified working: `kilo-auto`, `gpt-oss-20b`, `llama-3.3-70b` all returned
200; `auto` routed to `Qwen3.5-397B-A17B` (ovh).

- `aihorde` — 32 models, crowd-sourced, **slow** (tens of seconds)
- `kilo` — 13 `:free` models, 200 req/hr per IP
- `ovh` — 13 models, anonymous mode ~2 req/min per model (expect 429s)
- `parallel` is also keyless but search-only, not a chat lane

If a keyless platform later stops working, check `status.js` provider status;
rate_limited is normal for kilo/ovh and the router falls over to the next.

## Unified key

- Format `freellmapi-<48 hex>`. Stored in the `settings` table of freeapi.db
  (`key = 'unified_api_key'`) — readable without the dashboard:
  `SELECT value FROM settings WHERE key='unified_api_key'`.
- Read over HTTP: `GET /api/settings/api-key` with a dashboard Bearer token.
- Regenerate: `POST /api/settings/api-key/regenerate` (invalidates old key and
  the env var — re-setx).
- Bootstrap writes it to user env `FREELLMAPI_API_KEY`; that is what
  opencode's `{env:FREELLMAPI_API_KEY}` resolves to.

## Dashboard auth (for script access)

The dashboard is a separate auth surface from the `/v1` unified key.

- `GET /api/auth/status` — unauth; `needsSetup`, `authenticated`, `desktop`.
- `POST /api/auth/setup` — first-run only (userCount=0), loopback exempt from
  the setup code; body `{email, password(min 8)}`; returns `{token, email}`.
- `POST /api/auth/login` — body `{email, password}`; returns `{token}`.
- `POST /api/auth/desktop-session` — **only works when the server runs with
  `FREEAPI_DESKTOP=1`** (the desktop app sets it; a plain server returns
  403). Do not rely on it here — bootstrap uses setup/login with
  `dashboard-creds.json` instead.

Admin API auth = `Authorization: Bearer <dashboard token>` (30-day sessions).

## Adding real provider keys

1. Put lines in `freellmapi-integration/provider-keys.env`
   (`GROQ_API_KEY=gsk_...`, `CEREBRAS_API_KEY=csk-...`, `GOOGLE_API_KEY=AIza...` —
   prefix detects the platform, parsed by the server's own key-parser).
2. Run `bootstrap.ps1` — it starts the server if needed, auths, and does
   `POST /api/keys/import` (multipart field `file`, so use `curl.exe -F
   "file=@..."` from PowerShell; Invoke-WebRequest has no `-Form` in 5.1).
3. Re-run is idempotent: existing (platform,label) rows are updated in place.

Free key sources: Groq console.groq.com/keys, Cerebras cloud.cerebras.ai,
Google AI Studio, Mistral console, Cohere dashboard, NVIDIA build.nvidia.com.

## Auto-start

Scheduled task `freellmapi-server` runs `start-server.ps1` at logon
(registered 2026-10-17, RunLevel limited). The script is idempotent: if
`/livez` answers it exits 0 immediately. Server process: `node dist/index.js`
hidden, cwd = `server/` (the DB path is `__dirname`-relative, so cwd is safe).

## Wire model IDs vs opencode refs

Two different naming systems — mixing them gives 404 "not in the catalog":

- **opencode** refs use `provider/model`: `freellmapi/auto`.
- **the /v1 API** uses bare catalog ids, NO platform prefix: `auto`,
  `kilo-auto`, `gpt-oss-20b`, `llama-3.3-70b`, `Qwen3.5-397B-A17B`.
- The DB `models` table stores `(platform, model_id)` separately — that split
  is internal, never wire-facing.

## Traps (paid for in the 2026-10-17 setup session)

| Symptom | Cause | Fix |
| --- | --- | --- |
| `desktop_signin_forbidden` 403 on `/api/auth/desktop-session` | server lacks `FREEAPI_DESKTOP=1` env | use setup/login flow; do not start plain server with that flag just to reuse the desktop path |
| model 404 "not in the catalog" with `kilo/kilo-auto` | wire ids have no platform prefix | use `kilo-auto`; list live ids from `GET /v1/models` |
| `$env:FREELLMAPI_API_KEY` empty right after `setx` | setx writes to the registry; current process tree never sees it | restart the consumer (opencode), or set the session var explicitly |
| harness reports `ChildProcess.kill` when a script Start-Process's the server | the redirected-output handles keep the child tree "alive" from the harness's view; the server itself survives detached | run launcher scripts and tolerate the kill message; verify with `/livez`, not with the exit code |
| `Invalid or unexpected token` on `.mjs` with `require` in it | the skills tree resolves as ESM (nearest package scope); `require` is undefined, TS `as` is a syntax error | status script is `status.js` (CJS); keep skill scripts CJS or add a `package.json` with `"type":"commonjs"` |
| `Out-File -Encoding UTF8` produces a BOM that breaks `node` | PowerShell 5.1 UTF8 always writes BOM | write BOM-less via `[System.IO.File]::WriteAllText($p,$s,(New-Object System.Text.UTF8Encoding($false)))` |
| nested `powershell -File` from the bash tool gets killed | same child-tree issue as above | invoke with the call operator `& script.ps1` from the session shell instead |
| `/v1/providers` empty after a fresh start | no key rows at all — the legacy baseline does NOT seed keyless sentinels | the declarative config is what creates them; check `FREEAPI_CONFIG_PATH` is set for the server process |

## Quick recovery

```powershell
# is anything alive?
node "$env:USERPROFILE\.config\opencode\skills\freellmapi\scripts\status.js"

# bring the server up (idempotent)
& "$env:USERPROFILE\.config\opencode\freellmapi-integration\start-server.ps1"

# re-auth + import keys + refresh the env key
& "$env:USERPROFILE\.config\opencode\freellmapi-integration\bootstrap.ps1"
```

If the unified key was regenerated, bootstrap (or a manual
`GET /api/settings/api-key` + `setx`) restores the env var; then restart
opencode.
