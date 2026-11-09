#!/usr/bin/env node
'use strict';

// Check events due now (overdue or within 15 min)
// Exit code: 0 = none due, 1 = due events found (printed as JSON)

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'events.json');

if (!fs.existsSync(FILE)) {
  console.log('[]');
  process.exit(0);
}

const events = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const now = new Date();
const windowEnd = new Date(now.getTime() + 15 * 60 * 1000);

const due = events.filter(e =>
  e.status === 'pending' && new Date(e.due) <= windowEnd
).sort((a, b) => new Date(a.due) - new Date(b.due));

console.log(JSON.stringify(due, null, 2));
process.exit(due.length ? 1 : 0);