#!/usr/bin/env node
'use strict';

// Add an event to data/events.json
// Usage: node add-event.js "Title" "2026-11-09T21:30:00+05:00" "tag1,tag2"

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'events.json');

if (process.argv.length < 4) {
  console.error('usage: node add-event.js "Title" "ISO-datetime" [tags...]');
  process.exit(2);
}

const title = process.argv[2];
const due = process.argv[3];
const tags = process.argv.slice(4).map(t => t.replace(/,$/, ''));

// Validate ISO datetime
const d = new Date(due);
if (isNaN(d.getTime())) {
  console.error('invalid datetime:', due);
  process.exit(2);
}

const id = 'evt_' + d.toISOString().slice(0, 19).replace(/[-:T]/g, '');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let events = [];
if (fs.existsSync(FILE)) {
  try { events = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { events = []; }
}

events.push({ id, title, due, recurrence: null, tags, status: 'pending' });
fs.writeFileSync(FILE, JSON.stringify(events, null, 2), 'utf8');
console.log('added:', id);