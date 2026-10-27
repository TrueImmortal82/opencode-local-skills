#!/usr/bin/env node
'use strict';

// Mechanical ASD-STE100 gate: flags high-yield violations in a Markdown doc.
// Exit codes: 0 clean, 1 violations found, 2 usage/IO error.

const fs = require('fs');

const WHITELIST = new Set([
  'position', 'condition', 'function', 'location', 'definition', 'description',
  'instruction', 'instructions', 'information', 'direction', 'connection',
  'protection', 'application', 'configuration', 'identification',
  'communication', 'documentation', 'operation', 'operations', 'motion',
  'station', 'equipment', 'environment', 'requirement', 'requirements',
  'component', 'components', 'activity', 'property', 'capacity', 'quality',
  'quantity', 'reliability', 'sensitivity', 'compatibility', 'availability',
  'efficiency', 'stability', 'connectivity', 'continuity', 'electricity',
  'security', 'velocity', 'performance', 'distance', 'occurrence', 'tolerance',
  'resistance', 'allowance', 'guidance', 'compliance', 'dependence',
  'presence', 'difference', 'reference', 'consequence', 'appearance',
  'importance', 'evidence', 'relevance', 'preference', 'confidence',
  'independence',
]);

const file = process.argv[2];
if (!file) {
  console.error('usage: node ste-check.js <doc.md>');
  process.exit(2);
}
let text;
try {
  text = fs.readFileSync(file, 'utf8');
} catch (e) {
  console.error(`cannot read ${file}: ${e.message}`);
  process.exit(2);
}

const errors = [];
const warnings = [];
const note = (kind, n, tag, line) => {
  const arr = kind === 'error' ? errors : warnings;
  const snippet = line.trim().slice(0, 60);
  arr.push(`${file}:${n}: [${tag}] ${snippet}`);
};

let inFence = false;
text.replace(/\r\n/g, '\n').split('\n').forEach((raw, i) => {
  const n = i + 1;
  const line = raw.replace(/\r$/, '');
  if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; return; }
  if (inFence) return;
  const t = line.trim();
  if (!t || /^https?:\/\//.test(t) || /^[-*|]\s*\|/.test(t) && false) return;

  if (t.includes(';')) note('error', n, 'semicolon', line);

  const modals = t.match(/\b(will|shall|should)\b/gi);
  if (modals) modals.forEach((m) => note('error', n, 'modal ' + m.toLowerCase(), line));
  if (/\bmust\b/i.test(t)) note('warning', n, 'must (allowed only in stated requirements)', line);

  if (/\b(it is|there is|there are)\b/i.test(t)) note('error', n, 'it is / there is', line);
  const rel = t.match(/\b(which|who|that)\b/gi);
  if (rel) rel.forEach((m) => note('error', n, 'relative ' + m.toLowerCase(), line));

  if (/\b(was|were)\b/i.test(t)) note('error', n, 'past tense', line);
  if (/\b(is|are|been|being)\s+[a-zA-Z'-]+ed\b/i.test(t)) note('warning', n, 'passive voice', line);

  const nom = t.match(/\b[a-zA-Z]+(?:tion|sion|ment|ity|ance|ence)\b/g) || [];
  const seen = new Set();
  nom.forEach((w) => {
    const lw = w.toLowerCase();
    if (!WHITELIST.has(lw) && !seen.has(lw)) {
      seen.add(lw);
      note('error', n, 'nominalization ' + lw, line);
    }
  });

  const numWords = /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|hundred|thousand|million|first|second|third)\b/gi;
  let m;
  while ((m = numWords.exec(t)) !== null) {
    const before = t.slice(0, m.index);
    const atSentenceStart = before.length === 0 || /[.!?]\s*$/.test(before);
    if (!atSentenceStart) note('error', n, 'spelled number ' + m[0], line);
  }

  const repeat = t.match(/\b([A-Za-z]{2,})\s+\1\b/i);
  if (repeat) note('error', n, 'repeated word ' + repeat[1], line);

  const ands = t.match(/\band\b/gi) || [];
  if (ands.length >= 4) note('error', n, 'long and-chain (' + ands.length + ')', line);

  if (/\d(?=[a-zA-Z])/.test(t)) note('error', n, 'number glued to unit', line);
});

errors.forEach((e) => console.error('ERROR   ' + e));
warnings.forEach((w) => console.log('warning ' + w));
console.log(`${file}: ${errors.length} error(s), ${warnings.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
