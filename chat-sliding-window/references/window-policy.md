# Window policy — eviction, summarization, rehydration

The assembler runs before every model call. It never writes to the message
store; it only reads. All state it needs:

```
turns: [{ id, seq, role, content, tool_calls, tool_results, tokens }]
head_k: int          # turns kept verbatim at the front (default 4)
budget: int          # tokens available for slots 2+3 (see SKILL.md budget math)
summary_cap: int     # max tokens for the digest (default 400)
```

`seq` is the monotonically increasing turn number — the only ordering the
assembler trusts. Never order by timestamp.

## Step-by-step assembly

1. **Reserve the tail.** `remaining = budget − tokens(tail)`.
2. **Take head verbatim.** `remaining −= tokens(head turns)`. If head alone
   overflows (pathological long first exchange), keep the first turn and
   summarize the rest of the head — flag it in the log.
3. **Walk backwards from newest**, adding turns to `recent` while
   `remaining ≥ tokens(next_turn) + summary_cap`. Stop at the first turn that
   does not fit. That is the window's left edge `L`.
4. **Everything between head and L** is the eviction zone.
   - If it is empty: no summary slot; done.
   - Otherwise: build `summary(L..L_end)`.
     - If a summary of a *prefix* of that zone already exists from the
       previous assembly (same left edge `L`), reuse it — do not re-summarize
       on every turn, that burns tokens and drifts.
     - Otherwise: one model call (small/fast model preferred) with the
       summarization prompt below over the zone's turns.
5. **Rehydrate if requested.** If the current tail contains an explicit
   recall ("what did we say about X / show me that message from earlier"),
   fetch the matching turns from the store by `seq` and re-insert them at
   their original position between head and summary, evicting `recent` turns
   from the *newest* side to pay for them. Then rebuild the budget.
6. **Log and return.** One line, always:
   `window=system+head+summary+recent+tail kept=<n> summary=<L>..<R>
   tokens=<used>/<budget>`

## Summarization prompt (the whole contract)

```
You are compressing conversation turns for context reuse.
Rules:
- Paraphrase ONLY. No new facts, no speculation, no advice.
- Keep: decisions made, user preferences and corrections, open questions,
  concrete values (names, numbers, file paths, deadlines).
- Drop: pleasantries, repetitions, content already covered by the head turns.
- Format: a flat bullet list. Start with "Summary of turns <L>–<R>:".
- If a turn was truncated earlier, keep its "(truncated)" marker.
Input turns (verbatim):
<<<
{zone turns with role labels}
>>>
```

Verify the output: it must be shorter than the input (reject and retry once
if not), and every concrete value in it must appear verbatim in the input —
a cheap string check that catches invented facts before they enter the
window.

## Truncation fallback (last resort only)

When a SINGLE turn exceeds `summary_cap` (e.g. a huge pasted file or a giant
tool result):

- store: keep the full text in the DB untouched;
- window: keep its first `summary_cap` tokens + `…(message truncated,
  full text in history)`.

A tool result that is data, not conversation (a file dump, a stack trace),
may be truncated at a line boundary instead of a token boundary, with the
same marker. Never truncate a user message mid-sentence without the marker.

## Rehydration flow

1. Recall detected in the tail (explicit request, or the runtime's own
   search: store-level `LIKE`/FTS over `content` for the referenced noun).
2. `SELECT ... FROM turns WHERE seq IN (...) ORDER BY seq` — verbatim.
3. Insert at original `seq` positions; recompute budgets; re-summarize only
   the zones whose coverage changed.
4. Rehydrated turns stay in the window for at most 2 further assemblies,
   then become eligible for eviction again — otherwise a single recall
   permanently inflates every future call.

## Budget example (concrete numbers)

Model window 128k, max output 8k, Russian-heavy text (~3.1 chars/token).

```
safety_margin   = 12800          (10%)
reserved_output = 8000
system          ≈ 1500
head (4 turns)  ≈ 1200
tail (current)  ≈ 300
--------------------------------
recent budget   ≈ 105300
summary_cap     = 400
→ recent fits ≈ 24 average turns (4300 tokens each, tool results included)
```

When a tool result pushes one turn past 10k tokens, do not let it silently
eaten half of `recent`: apply the truncation fallback to the tool result and
log `truncated=tool:<id> from=<n>to=<m>`.

## State that must survive restarts

- `last_summary_left_edge` (L) and the summary text itself — stored per
  conversation, so a restart does not re-burn a summarization call.
- Nothing else. `recent` is recomputed from the store every call; it must
  not be persisted, or two restarts can disagree about what "recent" was.
