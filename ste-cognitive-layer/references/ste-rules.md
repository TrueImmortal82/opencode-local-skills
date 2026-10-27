# STE rules — Simplified Technical English (ASD-STE100)

STE is a controlled English language for technical documentation, maintained
by ASD (Aerospace, Defence and Infrastructure). It is not "plain English": it
has a fixed vocabulary (~1,000 approved words plus a small additional set),
fixed grammar, and fixed structure. A word is either approved or it is an
exception that must be justified.

**Scope:** apply to English technical text. Do not apply to Russian.

## Vocabulary

- Use approved words only. One word = one concept. No synonyms.
- Do not repeat a word in a sentence.
- Prefer the approved term for a concept; if no approved term exists, use the
  term from the STE additional words list, or an exception justified in a
  glossary.
- Abbreviations: define once, then use the abbreviation. No undefined acronyms.
- Technical terms not in the STE dictionary are allowed as exceptions; note
  them in a glossary.

## Grammar

- **Present tense**, active voice. No past or future tense in procedures.
- **Imperative mood** for instructions: "Do X", "Check Y". No "shall", "must",
  "should" (use them only where a requirement is being stated, not in a
  procedure).
- **Simple sentences**. No compound sentences with "and" joining clauses;
  split them. No relative clauses ("which", "who", "that").
- No "it is … that" constructions. No "there is/are".
- **Articles** are mandatory and correct: a/an/the. Do not drop them.
- **Prepositions**: use the approved ones. Avoid "as", "for", "by" where a
  clearer verb exists.
- **Nominalizations are forbidden**: -tion, -ment, -ity, -ance, -ence words
  ("installation", "maintenance", "ability"). Use the verb: "install", "maintain".
- **Noun phrases** no longer than 2–3 words. "The hydraulic system pressure"
  is a noun phrase; restructure if it runs longer.
- **Numbers**: digits, not spelled out (except at sentence start). Unit and
  number separated by a space: "5 mm", "100 °C".
- **Units**: SI units, no imperial unless required.

## Punctuation

- No semicolons. No colons in procedures (colons are for headings).
- Commas: up to 3 items in a list separated by commas; use "and" for the last.
  For more than 3 items, use a bulleted list.
- No parentheses in procedures; use a separate sentence or a note instead.

## Structure

- One idea per sentence. One idea per paragraph.
- Description before procedure: describe the system, then give the steps.
- Headings: noun phrases, no gerunds, no "how to".
- Procedures: imperative, numbered steps, each step one action.
- Notes and warnings: short, placed immediately before or after the affected
  step. Warnings for hazards, notes for non-obvious facts.

## Anti-patterns (and their STE replacements)

| Non-STE | STE |
| --- | --- |
| "The system will start automatically." | "The system starts automatically." |
| "It is necessary to check the pressure." | "Check the pressure." |
| "Installation of the component requires tools A and B." | "Install the component using tools A and B." |
| "The valve, which is located downstream, opens when…" | "The valve opens when…" (drop the clause) |
| "Use the wrench and the screwdriver to remove the bolt." | "Use the wrench and the screwdriver to remove the bolt." (allowed: two items) |
| "The pressure should be approximately 100 kPa." | "The pressure is 100 kPa." (state the value) |

## Pre-ship checklist

- [ ] Every sentence is present tense or imperative.
- [ ] No "which", "who", "that", "it is … that", "there is/are".
- [ ] No nominalizations (-tion, -ment, -ity, -ance, -ence).
- [ ] No noun phrase longer than 3 words.
- [ ] No word repeated in a sentence.
- [ ] Every word is from the STE dictionary, or justified as an exception.
- [ ] All abbreviations defined before use.
- [ ] Numbers are digits with a space before the unit.
- [ ] One idea per sentence, one idea per paragraph.
- [ ] Description before procedure; headings are noun phrases.

## Success criterion

The document is concise and unambiguous **and** keeps 100% of the
architectural depth from the logic stage. If clarity required deleting a
constraint, an edge case, or a trade-off, the STE stage was applied wrong —
restructure, do not reword.