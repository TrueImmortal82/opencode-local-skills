---
name: ste-cognitive-layer
description: generate technical text through a 3-stage cognitive pipeline — deep engineering logic, then strict structured hierarchy, then Simplified Technical English (ASD-STE100) — instead of post-hoc editing, so STE is the final assembly stage rather than a filter. Covers controlled vocabulary and grammar rules, the anti-simplification success criterion (100% of architectural depth preserved), and the pre-ship STE checklist. Use when writing technical documentation, procedures, or architecture descriptions that must be both crystal-clear and technically deep; when a draft loses technical depth under "simplification"; or when adopting Simplified Technical English in a project. Pairs with persona-guard (voice) and chat-sliding-window (context). Not for prose, marketing, or creative writing.
license: MIT
---

# ste-cognitive-layer

The failure mode of AI technical writing is a two-step dance: the model writes a
dense paragraph, you ask it to "simplify", and it strips out the architecture,
the edge cases, the trade-offs — in the name of clarity. **Simplified Technical
English** (ASD-STE100) is a controlled language for technical documentation.
Treat STE as a *filter on finished prose* and it does exactly that.

Core principle: **clarity is a property of structure, never of word count.**
Simplify the structure, never the substance. STE is the final assembly stage of
a 3-stage pipeline; it constrains wording, never the architecture.

## The pipeline (all three, in order)

### Stage 1 — Logic (foundation)
Produce the maximally deep and accurate engineering logic. Nothing is dropped
here.

- Problem, constraints, inputs/outputs, failure modes, trade-offs.
- Preserve every technical nuance: version specifics, edge cases,
  dependencies, non-obvious invariants.
- Do NOT simplify, rephrase, or choose "easier" words. Verbose, jargon-heavy,
  unpolished is fine and intended at this stage.
- Vocabulary is not yet constrained; write in the working language.

### Stage 2 — Structuring
Turn the logic into a strict hierarchy of relationships; remove semantic
repeats and logical loops.

- Hierarchy: goal → subsystems → components → steps.
- Semantic repeats: if two sentences say the same thing in different words,
  keep one and fold the other's unique content into it.
- Logical loops: no circular reasoning, no conclusion restated as a premise.
- A fact stated in a description is not re-stated in a procedure unless it is
  an input to that procedure.
- Output: a strict, connected hierarchy. No prose fluff, no hedging, no
  "in order to".

### Stage 3 — STE (assembly)
Dress the structure in Simplified Technical English — controlled vocabulary,
no ambiguity, no linguistic noise — without reducing technical substance.

- Apply ASD-STE100 rules: `references/ste-rules.md`.
- One word = one concept. No synonyms, no repeated words in a sentence.
- Present tense, active voice, simple sentences. Imperative for instructions.
- Verbs for actions, nouns for objects. No nominalizations (-tion, -ment,
  -ity). No noun chains longer than 2–3 words.
- No vague words, no hedging, no "it is … that" / "which" / "who" clauses.
- Numbers as digits (except at sentence start); units with a space.
- STE constrains *wording*, never the architecture from Stage 2.

## Success criterion — the anti-simplification test

A technical document is crystal clear and concise **and** keeps 100% of the
architectural depth. If achieving "simplicity" requires sacrificing accuracy,
the cognitive layer failed.

Concretely, after assembly:
- every constraint, edge case, and trade-off from Stage 1 is still present —
  restructured, never deleted;
- a reader can follow the architecture without re-deriving it;
- no sentence exists only to sound "simple".

## When to use

- Technical documentation, procedures, architecture descriptions, design notes.
- A draft that is accurate but unreadable → run the pipeline.
- A draft that is readable but loses technical depth → the filter approach
  failed; use the pipeline.
- Any project adopting ASD-STE100.

## When NOT to use

- Prose, marketing, creative writing (STE is for technical documentation).
- Conversational or explanatory text for non-technical audiences.
- Code itself — that is `code-discipline` / `repair-not-rewrite`.

## Language caveat (decide first)

**ASD-STE100 is an English standard.** Its controlled vocabulary and grammar
rules apply to English technical text and do not transfer to Russian. Before
starting, settle the deliverable's language:

- English → apply STE rules verbatim.
- Russian → run the full pipeline (logic → structure → concise, noise-free
  wording) but apply Russian plain-language discipline, not STE vocabulary.

Never mix the two in one document.

## STE essentials (full rules: `references/ste-rules.md`)

- Controlled vocabulary: ~1,000 approved words plus a small additional set;
  every word is approved or justified.
- Present tense, active voice, simple sentences, correct articles.
- Forbidden: nominalizations, long noun phrases, "it is … that", "which"/"who",
  vague words, hedging, "and" chains in long lists.
- One idea per sentence, one idea per paragraph; description before procedure.

## Failure modes

| Symptom | Cause | Fix |
| --- | --- | --- |
| "Simplified" doc lost all architecture | Stage 3 ran without 1–2 | re-run from Stage 1 |
| Doc is clear but vague | Stage 1 was shallow | deepen the logic first |
| Repeated meaning across sections | Stage 2 skipped | merge / dedupe |
| STE applied as a post-filter to finished prose | wrong approach | restructure, then apply STE |
| Jargon replaced by filler words | Stage 3 over-aggressive | STE constrains wording, not substance |

## Interlocks

- `persona-guard` — voice layer; STE constrains wording, persona constrains
  identity. Do not let STE's formality overwrite the persona's register.
- `chat-sliding-window` — long technical docs get summarized; keep the
  STE-structured doc pinned in the head/summary, not evicted.
- `task-closure` — the pipeline is a task; mark each stage done before the next.
- `repair-not-rewrite` — when editing an existing doc, patch it surgically;
  do not regenerate the whole STE document.