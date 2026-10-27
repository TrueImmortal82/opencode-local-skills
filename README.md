# opencode-local-skills

Machine-local [OpenCode](https://opencode.ai) skills for a personal Windows
setup (PowerShell 5.1, console cp866). Unlike the distributable
[open-code-skills](https://github.com/TrueImmortal82/open-code-skills) plugin,
these depend on this box: local services, absolute paths, personal runtime
state. Each skill is a `SKILL.md` (routing + rules) with `references/`
detail and `scripts/` gates, validated by the
[skill-authoring](https://github.com/TrueImmortal82/open-code-skills) validator
in `--strict` mode.

## Curated local skills (5)

### freellmapi — local LLM router runbook
Operational runbook for a local FreeLLMAPI LLM router on
`127.0.0.1:3001`: server boot via the repo's declarative config
(`FREEAPI_CONFIG_PATH`), keyless provider seeding (aihorde / kilo / ovh),
unified `freellmapi-` API key lifecycle, dashboard auth, and opencode
provider wiring. `scripts/status.js` is a standalone health check
(server up, key source, provider health, model count) — exit 0/1.

### chat-sliding-window — context layout for long-lived assistants
The head/pinned/summary/recent/tail window policy for a long-running
companion assistant: what may be evicted, what must stay pinned, how a
summary is formed, and the log line that proves the window behaved.
`references/window-policy.md` carries the full policy.

### persona-guard — identity vs. model drift
Treats an assistant's persona as **runtime-owned state**, not prompt text:
a versioned persona file, behavioral rules checkable in a single output,
an anti-persona (named model tics, forbidden by shape), output-contract
enforcement, and a drift suite (golden prompts with trait assertions) that
re-runs on every model swap. `references/persona-file-format.md` and
`references/drift-suite.md` carry the file format and the test battery.

### repair-not-rewrite — surgical edit discipline
Repair is the smallest diff that makes the repro pass; regeneration
(re-emitting a whole file from the model's *belief* of it) silently drops
comments, literals, BOM/CRLF, and unrelated branches. Covers the
read-then-Edit protocol, the diff budget (`git diff --numstat` must show
only intended lines), when a full rewrite is justified, multi-site edits
with replaceAll count checks, Windows encoding traps, and recovery via
`git restore`. Interlocks: `test-first-fix`, `git-safety`, `code-discipline`,
`troubleshooting-tree`.

### ste-cognitive-layer — Simplified Technical English pipeline
Generates technical text through a 3-stage cognitive pipeline — deep
engineering **logic** → strict **structuring** (dedupe, no loops) →
**ASD-STE100** assembly — so STE is the final assembly stage, not a
post-hoc filter. Success criterion: crystal-clear and concise *and*
100% of architectural depth preserved; if "simplicity" costs accuracy, the
pipeline failed. Includes the `ru → ASD-STE100` auto-translation protocol
(unit-by-unit mapping, glossary output) and `scripts/ste-check.js`, a
mechanical gate (modals, relative clauses, nominalizations, passive,
spelled numbers, and-chains, unit spacing) — fix until exit 0.

## Vendored third-party skills (13)

Committed verbatim for durability, each keeping its own `LICENSE.txt`:
`algorithmic-art`, `canvas-design` (ships its own OFL-licensed fonts),
`discernment-nudge`, `doc-coauthoring`, `docx`, `frontend-design`,
`mcp-builder`, `pdf`, `pptx`, `slack-gif-creator`, `theme-factory`,
`webapp-testing`, `xlsx`. Tracked but not curated by this repo.

## Find a skill by keyword

| You need | Skill |
| --- | --- |
| "my local LLM router is down", FreeLLMAPI, unified key, keyless providers | `freellmapi` |
| assistant forgets the beginning of a long chat, context evict/summarize policy | `chat-sliding-window` |
| "the assistant's voice changed", sycophancy, "as an AI", model swap drift | `persona-guard` |
| edit broke unrelated code, huge diff for a small fix, rewrite-from-memory | `repair-not-rewrite` |
| simplify technical doc without losing architecture, ASD-STE100, Russian → English doc | `ste-cognitive-layer` |
| Word document (.docx) | `docx` |
| Spreadsheet (.xlsx) | `xlsx` |
| Presentation (.pptx) | `pptx` |
| PDF forms | `pdf` |
| MCP server | `mcp-builder` |
| test a local web app (Playwright) | `webapp-testing` |
| animated GIF for Slack | `slack-gif-creator` |
| themes and styling | `theme-factory`, `frontend-design`, `canvas-design` |
| writing docs/proposals | `doc-coauthoring`, `discernment-nudge` |
| generative art (p5.js) | `algorithmic-art` |

## Layout

```
freellmapi/          SKILL.md, scripts/status.js
chat-sliding-window/ SKILL.md, references/window-policy.md
persona-guard/       SKILL.md, references/persona-file-format.md,
                     references/drift-suite.md
repair-not-rewrite/  SKILL.md
ste-cognitive-layer/ SKILL.md, references/ste-rules.md,
                     references/ru-to-ste100.md, scripts/ste-check.js
docx/ pptx/ xlsx/    SKILL.md, scripts/office/{schemas,validators,helpers}
pdf/                 SKILL.md, forms.md, reference.md, scripts/
mcp-builder/         SKILL.md, reference/, scripts/
```