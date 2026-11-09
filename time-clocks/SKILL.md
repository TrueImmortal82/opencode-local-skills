---
name: time-clocks
description: always check the real wall-clock time and date via `Get-Date` or `date` in shell, never infer from prompt tokens or cached context. Covers timezone arithmetic for Moscow (+03) and UTC, daylight-saving awareness, PowerShell 5.1 date formats, scheduling reminders, and the planner-calendar integration. Use when the user asks "what time is it", sets a deadline, asks to remind at a time, compares timestamps, or works with dates. Pairs with `planner-calendar` for structured scheduling. Not for historical dates (use web search).
license: MIT
---

# time-clocks

The model has no internal clock. Every session starts blind: the "today's date"
in the system prompt is static and may drift from reality during a long session.
**Never guess the time. Always check.**

## Rule

Before any time-dependent decision, run:

```powershell
Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz"
```

The output is the single source of truth for this machine:
Windows, PowerShell 5.1, timezone `+05:00` (Pakistan Standard Time, UTC+5).

## Timezone arithmetic

| Target | Offset from local |
| --- | --- |
| Local (PS) | +05:00 |
| UTC | `Get-Date -Format o` |
| Moscow (MSK) | +3h from local (subtract 2) |
| CET (Central Europe) | +1h from local (subtract 4 in summer, 3 in winter) |

When the user mentions a time without specifying timezone, assume **local**
(+05:00) unless they explicitly say "UTC" or "Moscow".

## Formats for scripts

PowerShell 5.1 date formats for passing to scripts or tools:

```powershell
# ISO 8601 with timezone: 2026-11-09T19:30:00+05:00
(Get-Date).ToString("o")

# Simple sortable: 2026-11-09_19-30-00
(Get-Date).ToString("yyyy-MM-dd_HH-mm-ss")

# For log prefixes
(Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
```

## Common failure modes

| Symptom | Cause | Fix |
| --- | --- | --- |
| "It's 14:00" said confidently | guessed from cached context | run `Get-Date` |
| wrong deadline in another timezone | forgot to convert | show both local and target TZ |
| timestamp comparison wrong | compared strings instead of `[datetime]` objects | cast: `[datetime]"2026-11-09T14:00:00+05:00"` |
| "remind me in 30 minutes" | no mechanism | use `planner-calendar` + `scripts/check-due.js` |

## Scripts

- `scripts/current-time.js` — prints local time, UTC, and Moscow time in JSON.
  Run: `node scripts/current-time.js`

## Interlocks

- `planner-calendar` — stores events and deadlines; uses this skill for "now".
- `task-closure` — when a task has a deadline, compare `Get-Date` against it.