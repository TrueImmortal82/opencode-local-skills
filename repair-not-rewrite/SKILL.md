---
name: repair-not-rewrite
description: surgical repair discipline — fix code with the smallest diff instead of regenerating whole functions or files from the model's belief, which silently drops comments, string literals, formatting, BOM/CRLF, and unrelated branches. Covers the read-region-then-Edit protocol with `oldString`/`newString` anchors, the diff budget (`git diff --numstat` must show only intended lines), when a full rewrite is actually justified, multi-site edits with replaceAll count checks, and recovery from a regeneration via `git restore`. Use when an edit broke unrelated code, git diff shows a huge diff for a small fix, the model rewrote a file instead of patching it, after a Write-tool overwrite, or before any bug fix. Not for code style (`code-discipline`), test strategy (`test-first-fix`), or cause diagnosis (`troubleshooting-tree`) — those interlock with this skill.
license: MIT
---

# repair-not-rewrite

A fix and a rewrite are different acts. A **repair** is the smallest textual
change that makes the repro pass. A **regeneration** is the whole function or
file re-emitted from the model's *belief* about it — and a belief is built
from whatever attention happened to reach, which is why a fixed bug ships with
three broken neighbours.

## Why regeneration breaks code

- The rewrite emits the model's belief of the file, not the file. Attention
  is on the bug site; comments, exact string literals, edge branches, import
  order, and trailing lines are *reconstructed*, not copied.
- The diff becomes unreviewable: a 2-line fix buried in a 300-line rewrite
  has no signal left — neither you nor the model can see what changed.
- Unrelated breakage rides along unnoticed, because every regenerated line
  looks intentional in the diff.

## Edit protocol

1. **Read the region you will change.** Never edit a file from memory of a
   previous session or from an unread buffer.
2. **Smallest edit.** Use the Edit tool: `oldString`/`newString` covering only
   the changed lines. `oldString` must be unique in the file — widen it by a
   few surrounding lines for uniqueness, never shrink the change to match a
   convenient anchor.
3. **One concern per edit.** A fix never bundles cleanup, rename, or
   reformatting. Style work is its own task (`code-discipline`).
4. **Verify both halves:** the repro passes (per `test-first-fix`) AND the
   diff budget holds (below). Repair is done only when both do.

## Diff budget

After a repair, `git diff --numstat` (or `git diff --stat`) must show roughly
the lines of the logical change, not of the file. Heuristic: if
added+deleted lines exceed ~10x the size of the change you intended, you
regenerated — revert and redo as a patch. A whole-file diff after a one-line
fix is always a failure, even when the result compiles and tests pass.

## When a full rewrite is justified

- the file is new, or being deleted/moved wholesale;
- the structural change *is* the fix (splitting a function, flattening
  nesting where partial edits would leave contradictions);
- the file is under ~50 lines and its exact current content was just written
  in this session;
- it is a generated file and you edit the generator, not the output.

Even then: preserve the file's encoding and line endings, and read the diff
before moving on.

## Encoding traps (this box is Windows, PowerShell 5.1)

A rewrite frequently flips the file's BOM or CRLF/LF as a side effect — a
breakage unrelated to the bug. Preserve the existing encoding. When creating
a new text file, write BOM-less UTF-8 explicitly:
`[System.IO.File]::WriteAllText($p, $s, (New-Object System.Text.UTF8Encoding($false)))`.
A stray BOM breaks YAML frontmatter, `.mjs` treated as ESM, and parsers that
reject `﻿`.

## Multi-site changes

A rename or API migration is N surgical edits, not M file rewrites. Use the
Edit tool's replaceAll on the exact string, then check the reported match
count against what you expected — a surprise count is information about the
codebase, not a nuisance to force through.

## When a regeneration already happened

1. Stop. Do not pile fixes on top of the rewrite.
2. `git diff` to see the actual damage; decide per line. If unintended:
   `git restore -- <file>` (run the `git-safety` preflight first if the tree
   holds other uncommitted work).
3. Without git: restore from the last Read output of that file, or from the
   source of truth (upstream copy, package, template).
4. Redo the fix surgically; re-run the repro; check the diff budget again.

## Failure modes

| Symptom | Cause | Fix |
| --- | --- | --- |
| whole-file diff after a 1-line fix | Write tool used instead of Edit | restore; redo via `oldString`/`newString` |
| unrelated test broke after an "isolated" fix | rewrote from belief, not content | restore; minimal edit |
| comments or string literals vanished | rewrite does not attend to non-code lines | restore; diff line by line |
| parser/encoding error after the fix | BOM/CRLF flip during rewrite | restore original encoding; rewrite with a matching encoder |
| fix correct but formatting churn everywhere | drive-by cleanup folded into the repair | separate the concerns into its own change |
| Edit fails with "multiple matches" | anchor too common | widen context for uniqueness, do not fall back to rewriting the file |

## Interlocks

- `test-first-fix` — prove the failure before editing; the same check after.
  The repro passing proves the *cause*; the diff budget proves the *scope*.
- `git-safety` — preflight before `git restore`/`git checkout`/`git clean`
  when the working tree has other uncommitted work.
- `code-discipline` — style, naming, and file-size work is a separate task,
  never a passenger on a repair.
- `troubleshooting-tree` — if you cannot state the smallest change, you do
  not know the cause yet; editing blind is regeneration by another name.
