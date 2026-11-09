#!/usr/bin/env node
'use strict';

// Mark event done, auto-create next if recurring
// Usage: node mark-done.js <event_id>

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'events.json');
const id = process.argv[2];

if (!id) {
  console.error('usage: node mark-done.js <event_id>');
  process.exit(2);
}

if (!fs.existsSync(FILE)) {
  console.error('no events file');
  process.exit(2);
}

const events = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const idx = events.findIndex(e => e.id === id);
if (idx === -1) {
  console.error('event not found:', id);
  process.exit(2);
}

const event = events[idx];
event.status = 'done';

// If recurring, create next instance
if (event.recurrence) {
  const due = new Date(event.due);
  const next = new Date(due);
  switch (event.recurrence) {
    case 'daily': next.setDate(next.getDate() + 1); break;
    case 'weekly': next.setDate(next.getDate() + 7); break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
  }
  // Format in local time (+05:00) without timezone shift
  const pad = (n) => String(n).padStart(2, '0');
  const nextId = `evt_${next.getFullYear()}${pad(next.getMonth()+1)}${pad(next.getDate())}${pad(next.getHours())}${pad(next.getMinutes())}${pad(next.getSeconds())}`;
  const dueStr = `${next.getFullYear()}-${pad(next.getMonth()+1)}-${pad(next.getDate())}T${pad(next.getHours())}:${pad(next.getMinutes())}:${pad(next.getSeconds())}+05:00`;
  events.push({
    id: nextId,
    title: event.title,
    due: dueStr,
    recurrence: event.recurrence,
    tags: event.tags,
    status: 'pending'
  });
  console.log('next occurrence:', nextId);
}

fs.writeFileSync(FILE, JSON.stringify(events, null, 2), 'utf8');
console.log('done:', id);