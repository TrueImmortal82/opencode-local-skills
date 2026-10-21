# opencode-local-skills

Machine-local skills for the personal OpenCode setup on Windows
(PowerShell 5.1, console cp866). Unlike the distributable
[open-code-skills](https://github.com/TrueImmortal82/open-code-skills),
these depend on this box: local services, absolute paths, personal runtime
state.

## Skills

- **freellmapi** — runbook for the local FreeLLMAPI LLM router
  (`127.0.0.1:3001`); `scripts/status.js` health check.
- **chat-sliding-window** — head/pinned/summary/tail context layout for a
  long-lived assistant; `references/window-policy.md`.
- **persona-guard** — pin an assistant persona against model drift:
  runtime-owned persona file, anti-persona, drift suite.
- **repair-not-rewrite** — surgical edit discipline: minimal diff, diff
  budget via `git diff --numstat`, recovery from regeneration.

Vendored third-party skills living in this directory are intentionally
untracked.
