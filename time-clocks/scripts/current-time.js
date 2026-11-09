#!/usr/bin/env node
'use strict';

// Print current local, UTC, and Moscow time in JSON.
// Used by time-clocks skill for an unambiguous "now".

const now = new Date();
const utc = now.toISOString();
const local = now.toLocaleString('en-US', {
  timeZone: 'Asia/Karachi', // local tz for this box
  hour12: false,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit'
}).replace(', ', 'T');
const moscow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Moscow' }))
  .toISOString().replace('T', ' ').replace('Z', '');

console.log(JSON.stringify({
  local_tz: 'Asia/Karachi (+05:00)',
  local: local + '+05:00',
  utc: utc,
  moscow: moscow + ' (MSK, UTC+3)',
  unix_ms: now.getTime()
}, null, 2));