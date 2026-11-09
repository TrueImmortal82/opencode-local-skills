---
name: planner-calendar
description: structured scheduler for deadlines, reminders, and recurring events — stores events in a JSON file, checks due items via `scripts/check-due.js`, and uses `time-clocks` for "now". Use when the user sets a deadline, asks for a reminder, wants to see upcoming events, or schedules recurring work. Pairs with `time-clocks` (source of truth for time) and `task-closure` (deadline-gated tasks).
license: MIT
---

# planner-calendar

A minimal, file-based scheduler for this OpenCode instance. Events are stored in
`data/events.json` (one array of event objects). The only operations: add,
list, check-due, mark-done, delete. No external deps, runs on this box.

## Event schema

```json
{
  "id": "evt_20261109_193000",
  "title": "Deploy freellmapi v0.4.2",
  "due": "2026-11-09T21:30:00+05:00",
  "recurrence": null,
  "tags": ["deploy", "freellmapi"],
  "status": "pending"
}
```

- `id`: auto-generated sortable `evt_YYYYMMDD_HHMMSS`.
- `due`: ISO 8601 with timezone (local `+05:00`).
- `recurrence`: `null`, `"daily"`, `"weekly"`, `"monthly"` — if set, after
  marking done a next instance is auto-created.
- `tags`: free-text array for filtering.
- `status`: `pending` | `done` | `snoozed`.

## Commands (via scripts)

All scripts read/write `data/events.json` and exit non-zero on error.

```bash
# Add event
node scripts/add-event.js "Title" "2026-11-09T21:30:00+05:00" "tags..."

# List upcoming (next 7 days by default)
node scripts/list-events.js [days_ahead]

# Check due now (overdue + within 15 min)
node scripts/check-due.js

# Mark done (and auto-create next if recurring)
node scripts/mark-done.js <event_id>

# Delete
node scripts/delete-event.js <event_id>
```

## Due check behavior

`check-due.js` prints JSON array of events where `due <= now + 15min` and
status `pending`. Use it as a gate before any time-sensitive action:
`node scripts/check-due.js && do-the-thing` — if exit code non-zero, the
upcoming event is surfaced.

## Storage

File: `data/events.json` (created on first add). One file, human-readable,
no lock needed for single-writer.

## Failure modes

| Symptom | Cause | Fix |
| --- | --- | --- |
| "remind me at 15:00" and nothing happened | no scheduler process | use `check-due.js` in your shell prompt or a scheduled task |
| event vanished after reboot | stored in memory | file-based — survives restart |
| wrong time fired | timezone mismatch | always pass due with `+05:00`; `time-clocks` is the authority |

## Interlocks

- `time-clocks` — every script reads "now" from the system clock.
- `task-closure` — a task with a deadline gets an event; `check-due` gates
  the task's `close` step.