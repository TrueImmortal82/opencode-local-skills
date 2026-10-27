# ru → ASD-STE100 auto-translation protocol

Russian technical text → English ASD-STE100, automatically, without losing
technical depth. A deterministic script cannot translate — the LLM does. What
makes it *automatic* is the loop:

```
Russian doc → Stage 1 (logic, in Russian) → Stage 2 (structure, language-neutral)
            → Stage 3 (assemble in English STE) → scripts/ste-check.js
            → fix flagged lines → re-run until clean
            → depth check (every Stage-1 constraint still present)
            → ship doc + glossary
```

`scripts/ste-check.js` is the mechanical gate. It exits non-zero on any
violation, so the loop cannot stop "by feeling". Run it:

```powershell
node scripts/ste-check.js path/to/doc.md
```

Fix every flagged line and re-run until it exits 0. Only then is the document
STE-clean.

## Stage 3 rules: translate structure, not words

Do not translate sentence by sentence from the Russian text. Translate each
unit of the Stage-2 hierarchy into one STE sentence. The mapping:

| Russian pattern | STE output |
| --- | --- |
| "Необходимо проверить давление." (imperative need) | "Check the pressure." |
| "Компонент должен быть установлен" (requirement) | "The component must be installed." (only if stating a requirement) |
| "Компонент устанавливается" (passive) | "Install the component." (imperative) or active voice |
| "В случае перегрева система отключается" | "The system shuts down in case of overheat." (keep the edge case — do not delete it for brevity) |
| Russian noun chains ("система управления давлением гидравлики") | Split: "The hydraulic pressure control system." (max 3-word noun phrase) |
| "должен/следует/можно" | drop, or "must" for a stated requirement only |
| Russian abbreviations | keep, define once before first use |

- One idea per sentence, even if the Russian sentence carried two — split it.
- Technical terms outside the STE dictionary: keep them as exceptions and
  list every one in a glossary at the end of the document.
- Numbers and units: digits, space before the unit ("5 mm", "100 °C").

## What the checker enforces

`scripts/ste-check.js` flags, per line:

- modal verbs in procedures: `will`, `shall`, `must`, `should`
- `it is`, `there is`, `there are`
- relative clauses: `which`, `who`, `that`
- semicolons
- nominalizations: `-tion`, `-sion`, `-ment`, `-ity`, `-ance`, `-ence`
  (whitelist of common approved words is inside the script)
- passive: `is/are/was/were/been/being` + past participle
- past tense: `was`, `were`
- spelled-out numbers not at sentence start
- a word repeated twice in the same sentence
- four or more `and` in one sentence
- number glued to its unit: `5mm` → `5 mm`

The checker is mechanical, not a full STE parser — it catches the high-yield
violations so the LLM stops early. A clean exit is necessary, not sufficient:
a final human read still applies.

## Depth check (before shipping)

Compare the STE document against the Stage-1 logic list, line by line:

- [ ] every constraint is present
- [ ] every edge case is present
- [ ] every trade-off is present
- [ ] no sentence exists only to sound simple

If anything is missing, restore it in STE form — restructure, do not delete.

## Output

Two files:
- `<name>.ste.md` — the ASD-STE100 document.
- `<name>.glossary.md` — every non-STE term used, with its meaning, so the
  reader can resolve exceptions without guessing.
