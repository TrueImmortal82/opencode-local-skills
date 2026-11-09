#!/usr/bin/env node
'use strict';

// List upcoming events
// Usage: node list-events.js [days_ahead=7]

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'events.json');
const daysAhead = process.argv[2] ? parseInt(process.argv[2], 10) : 7;

if (!fs.existsSync(FILE)) {
  console.log('[]');
  process.exit(0);
}

const events = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const now = new Date();
const cutoff = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

const upcoming = events
  .filter(e => e.status === 'pending' && new Date(e.due) <= cutoff)
  .sort((a, b) => new Date(a.due) - new Date(b.due));

console.log(JSON.stringify(upcoming, null, 2));