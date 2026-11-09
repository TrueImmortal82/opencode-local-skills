#!/usr/bin/env node
'use strict';

// Delete an event
// Usage: node delete-event.js <event_id>

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'events.json');
const id = process.argv[2];

if (!id) {
  console.error('usage: node delete-event.js <event_id>');
  process.exit(2);
}

if (!fs.existsSync(FILE)) {
  console.error('no events file');
  process.exit(2);
}

let events = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const before = events.length;
events = events.filter(e => e.id !== id);
if (events.length === before) {
  console.error('event not found:', id);
  process.exit(2);
}

fs.writeFileSync(FILE, JSON.stringify(events, null, 2), 'utf8');
console.log('deleted:', id);