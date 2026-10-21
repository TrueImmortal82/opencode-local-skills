---
name: chat-sliding-window
description: sliding-window chat context manager for a long-lived assistant — evicts, summarizes, or pins old turns so every model call fits a token budget instead of resending the whole transcript. Covers the five-slot window layout (system/head/summary/recent/tail), the eviction and rehydration algorithm in references/window-policy.md, budget math, context-overflow 400 retries, and integration with an assistant runtime that uses a durable turn/message pipeline (`assistant-runtime-architecture`). Use when the user says chat context is too big, tokens are burning, history keeps getting truncated mid-sentence, the model forgets early conversation, or when building the context assembler next to `assistant-runtime-architecture` (projection). Not for opencode's own session compaction.

**Literal tokens:** context overflow 400, token budget, sliding-window, references/window-policy.md, assistant-runtime, recent window, summary digest, tool_calls, prepare_delivery, complete_delivery, message projection, message content, token consumption, context budget, message retention, durability, bucket assembly, context overflow, 400 error, message truncation
license: MIT
---

# Chat sliding window

A long assistant chat that resends its full transcript to the model on every
turn pays O(n²) tokens over the conversation's life and eventually hits the
context limit. The fix is a **sliding window**: every call sends a *projection*
of the transcript, not the transcript. The transcript itself stays complete
on disk; the window is just the lens.

This is the same discipline as the message projection in the assistant
runtime (`assistant-runtime-architecture`): the store is the source of truth,
the window is a derived, disposable view. Never mutate the store to save
space.

## The five slots

Every assembled context is exactly five slots, in this order. Read
`references/window-policy.md` before implementing any of them — the eviction
order and the summarization contract live there.

```
[0] system        — persona, contracts, safety. Fixed, never evicted.
[1] head          — first K turns, verbatim. Never evicted.
[2] summary       — running digest of everything between head and recent.
[3] recent        — last N turns verbatim, newest last.
[4] tail          — the in-flight turn: user's current message + any tool
                    results generated this turn.
```

- **head** preserves identity anchors: what the user asked for, their name,
  agreed conventions, stated preferences. Typically K = 3–6 turns.
- **summary** is ONE message, role `user` or a dedicated `assistant` note,
  written by the model during eviction (never by string truncation). It is
  rewritten each time the window slides; the rewrite must be idempotent in
  effect — re-summarizing the same content yields the same claims, no new
  facts invented.
- **recent** is the workbench: last N turns where the model's working memory
  lives. N is chosen from the budget, not taste.
- **tail** is always present, always current-turn data.

## Hard rules

1. **The store never loses data to save tokens.** Eviction removes turns from
   the *window*, not from the database. Every evicted turn must be
   rehydratable: a "tell me what we discussed around X" request can pull
   old turns back verbatim.
2. **Evict on turn boundaries, never mid-turn.** A user message and its
   assistant response (plus tool calls/results that belong to that exchange)
   are one atomic unit. Splitting one in two corrupts the conversation the
   model sees.
3. **Summarize, don't truncate, and never truncate mid-sentence.** Truncating
   text to a byte limit leaves dangling clauses and silently loses facts.
   Truncation is allowed only as the final fallback when a single turn is
   itself bigger than the whole budget, and then mark it:
   `"(earlier message, truncated)"`.
4. **The summary message carries its coverage range.** E.g.
   `"Summary of turns 7–41: …"`. This makes it auditable and prevents the
   model from mistaking the digest for a user instruction.
5. **Budget math before assembly.** Compute the budget from the model's
   context window: `budget = window − reserved_for_output − tail_tokens −
   head_tokens − system_tokens − safety_margin(10%)`. `recent` gets whatever
   remains, counted **with tool results**, which are the silent token hogs.
   If `recent` fits fewer than 2 turns, shrink the summary, not the user's
   current message.
6. **Window assembly is deterministic and logged.** Given the store state and
   the budget, the same window comes out every time, and the assembly logs
   one line: `window=slots, kept=<n> summary=<L>..<R> tokens=<used>/<budget>`

## Token budget defaults

| Slot | How sized |
| --- | --- |
| `reserved_for_output` | the model's max output setting, full |
| `head` | fixed turn count (K), whatever it costs |
| `summary` | capped (e.g. 400 tokens); if the digest exceeds the cap, summarize the summary |
| `recent` | remainder, counted in real tokens (estimate 1 token ≈ 3.5 chars for CJK-heavy text, 4 chars otherwise — or run a real tokenizer when available) |
| `safety_margin` | 10% of the context window, always |

Token counting: use the model's tokenizer when it is installed in the
runtime; otherwise the char heuristic. A wrong estimate that errs *small*
is a context-overflow 400 at call time — the assembler must catch that
error and retry once with `recent` shrunk by one turn, rather than failing
the turn.

## Failure modes table

| Symptom | Cause | Fix |
| --- | --- | --- |
| Model answers as if the user said something it didn't | summary invented a detail | make the summarization prompt "paraphrase only, list no facts not present in the input"; verify against the store |
| Early conventions keep being forgotten | head too small, or preferences live past the head | pin recurring facts (name, language, conventions) into the system slot as explicit lines |
| Context-overflow 400s at random | budget did not count tool results | count tool outputs in `recent`; they routinely dominate |
| Same question, different quality on two runs | non-deterministic eviction (e.g. timestamp tie-break) | evict by turn sequence number, tie-break by id |
| After rehydration the model is confused | old turns reinserted at the *end* | rehydrated turns go back into their sequence position and the window is re-assembled, not appended |

## Reference map

- `references/window-policy.md` — the eviction algorithm step by step,
  summarization prompt, rehydration flow, state schema, and the worked
  budget example. Read it when implementing or debugging the assembler.

## Incident notes

None yet — first session establishing the pattern. Append a dated note here
when a real assistant hits a window bug: symptom, the log line that
identified it, the rule that would have prevented it.
