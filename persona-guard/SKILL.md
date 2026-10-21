---
name: persona-guard
description: pin a long-lived assistant's persona so the underlying model's defaults (sycophancy, hedging, bullet-list reflex, sign-off summaries, "as an AI" disclaimers) cannot drift it. Covers the runtime-owned persona file, behavioral rules instead of adjectives, the anti-persona (named suppressed defaults), persona as system slot 0 that sliding windows never evict, output-contract enforcement, temperature discipline, and a drift test suite that runs on every model swap. Use when the assistant's voice shifts, the model starts agreeing with a wrong user, personality resets after a model change, the user says the persona drifted, or when writing or reviewing a system prompt for a companion assistant. Pairs with chat-sliding-window (system slot) and assistant-runtime-architecture (output contracts).
license: MIT
---

# Persona guard

A model's training prior is a *helpful assistant voice*. A custom persona is
instructions competing with that prior, and on every generation the prior
wins somewhere. Left alone, a companion assistant slowly becomes "a generic
chatbot that once mentioned it has a name". The fix is not a better system
prompt — it is treating the persona as **runtime-owned state enforced at
several layers**, so no single layer's failure loses the identity.

Core principle: **the persona belongs to the runtime, not to the model.**
The model is a function; identity is external state fed in and verified out.
The model never edits it, the conversation never edits it, and a model swap
must re-prove it, not inherit it.

## Why drift happens (know the mechanism before fighting it)

- The prior is strongest at the *edges* of the persona: openers, closers,
  reactions to emotion, disagreement. Middle-of-task output obeys the persona
  fine; "Great question!" appears when the user is pleased or sad.
- Drift scales with **distance from the instruction**: in a long context the
  system prompt is read once and sampled against thousands of later tokens
  (see `chat-sliding-window` — that is why the persona must be system slot 0,
  never summarized away).
- Drift jumps on **model swaps**: the new model brings a new prior, and the
  old persona file was written against the old model's tics.
- Drift widens with **temperature**. Persona is not a style suggestion to be
  sampled around; persona-critical turns want the low end.

## The layers (apply all of them; each covers the others' failure)

1. **Persona file, runtime-owned.** A versioned file, not prompt text buried
   in code. Corrections from the user are *appended to the file* (with a
   date), never patched in-context and never "remembered" by the model.
   Read `references/persona-file-format.md` for the format.
2. **System slot 0.** The assembled context (see `chat-sliding-window`) puts
   the persona first, after nothing, before head/summary/recent. Sliding
   windows evict `recent`, they must not evict or compress slot 0.
3. **Behavioral rules, not adjectives.** "Be warm and honest" loses to the
   prior because it is unverifiable. Every persona line must be *checkable
   in a single output*: "When the user corrects you, acknowledge in at most
   one sentence and never apologize twice." If a line cannot be a test
   assertion, rewrite it until it can.
4. **The anti-persona.** Name the suppressed defaults explicitly, by their
   exact shape: "Openers like 'Great question!' / 'I'd be happy to!' are
   forbidden. No 'as an AI' disclaimers. No sign-off summary after task
   completion. No bullet list when a sentence fits. Sycophantic agreement
   with a user-stated wrong fact is a hard violation." Forbidden-by-name is
   dramatically more effective than "be natural" because the model can
   pattern-match its own tic.
5. **Output-contract enforcement.** Persona violations are one layer of the
   output-contract pipeline (see `assistant-runtime-architecture`): detect,
   repair, idempotent, anchored. Repairs are allowed only for trusted frames
   (your own model's known tics), never free rewriting.
6. **The drift suite.** A small battery of golden prompts with trait
   assertions, run on every model swap and periodically. It is the only
   honest answer to "did the voice change?" — see
   `references/drift-suite.md`.

## Hard rules

- **Never let the conversation edit the persona.** In-context tweaks ("from
  now on be sardonic") may *preview* a change, but the file is changed
  deliberately and versioned. Otherwise the persona becomes whatever the last
  user said.
- **The persona is written in the assistant's working language.** For a
  Russian assistant the persona file is Russian: the model drifts toward the
  language and register of its instructions, and a Russian persona written in
  English gets translated into English-flavored Russian at generation time.
- **First person, present tense, concrete.** "I answer in short sentences"
  beats "the assistant should be concise" — the model adopts first-person
  present lines as identity, not instructions about a third party.
- **Disagreement is the first test of a persona.** A persona that agrees
  with the user's wrong fact has no persona. The drift suite's most
  important golden prompt is one where the user asserts something false and
  the correct answer is a correction, delivered in-character.
- **On model swap: re-run the drift suite before trusting the voice.** A
  model that passed the last suite tells you nothing about the new one.
  Expect to re-author 2–5 anti-persona lines per swap.

## Failure modes

| Symptom | Layer that failed | Fix |
| --- | --- | --- |
| "Great question!" / "I'd be happy to!" appears | anti-persona | add the exact tic to the anti-persona by name |
| Agrees with a wrong user fact | disagreement test missing | add the golden disagreement prompt; add a contract rule |
| Voice is fine for 20 turns, then generic | persona got evicted/summarized | persona must be system slot 0; check the window log line |
| Sign-off summary after every task | anti-persona | forbid the closer by its exact shape |
| New model: everything "works" but feels wrong | no drift suite on swap | run it; re-author anti-persona lines for the new model's tics |
| User correction ("don't do that") is lost next session | correction stayed in-context | append to the persona file, dated |
| Persona lines in English, assistant in Russian | file language | rewrite the file in Russian |

## Reference map

- `references/persona-file-format.md` — the persona file's shape: identity
  block, behavioral rules, anti-persona, corrections log; worked example.
- `references/drift-suite.md` — the golden-prompt battery: prompt shapes,
  trait assertions, thresholds, model-swap protocol, how to read a failing
  score.
