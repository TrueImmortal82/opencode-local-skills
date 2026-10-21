#!/usr/bin/env node
"use strict";

/**
 * FreeLLMAPI status script — shows server liveness, unified key source,
 * configured providers (keys count, status), and catalog model count.
 *
 * Exit codes:
 *   0 — everything OK (server up, key present)
 *   1 — server or key problem
 *   2 — unexpected script error
 */

const path = require('path');
const fs = require('fs');

const FREELLMAPI_HOME = process.env.FREELLMAPI_HOME || path.join(process.env.HOME || '', '.config', 'opencode', 'freellmapi');
const SERVER_DIR = path.join(FREELLMAPI_HOME, 'server');

function logErrorAndExit(msg, code = 1) {
  console.error(`ERROR: ${msg}`);
  process.exit(code);
}

async function main() {
  const baseUrl = process.env.FREELLMAPI_URL || 'http://127.0.0.1:3001';
  const KEY_ENV = process.env.FREELLMAPI_API_KEY;

  // 1. server liveness
  let live;
  try {
    const resp = await fetch(`${baseUrl}/livez`, { signal: AbortSignal.timeout(3000) });
    if (!resp.ok) throw new Error(`status ${resp.status}`);
    live = await resp.json();
  } catch (e) {
    logErrorAndExit(`server down at ${baseUrl} (${e.message})`);
  }
  console.log(`server: UP ${live.version} uptime=${live.uptime_s}s`);

  // 2. unified API key source
  let key = KEY_ENV;
  let keySource = 'env FREELLMAPI_API_KEY';

  if (!key) {
    try {
      const Db = require(path.join(FREELLMAPI_HOME, 'node_modules', 'better-sqlite3'));
      const dbPath = process.env.FREEAPI_DB_PATH || path.join(SERVER_DIR, 'data', 'freeapi.db');
      const db = new Db(dbPath, { readonly: true });
      const row = db.prepare("SELECT value FROM settings WHERE key='unified_api_key'").get();
      key = row?.value;
      db.close();
      if (!key) throw new Error('no unified key in DB');
      keySource = 'server DB (setx FREELLMAPI_API_KEY to avoid this fallback)';
    } catch (e) {
      logErrorAndExit(`key unavailable — ${e.message}`);
    }
  }
  console.log(`key: ${key.slice(0, 12)}… (source: ${keySource})`);

  // 3. providers
  const authHeader = { Authorization: `Bearer ${key}` };
  let providers;
  try {
    const resp = await fetch(`${baseUrl}/v1/providers`, { headers: authHeader });
    providers = await resp.json();
  } catch (e) {
    logErrorAndExit(`failed to fetch providers — ${e.message}`);
  }
  console.log('providers:');
  if (providers.providers.length === 0) {
    console.log('  (none configured — add keyless platforms to config.json or real keys via bootstrap.ps1)');
  } else {
    for (const p of providers.providers) {
      console.log(`  ${p.platform}\t${p.status}\tkeys=${p.keys}`);
    }
  }

  // 4. catalog model count
  let catalog;
  try {
    const resp = await fetch(`${baseUrl}/v1/models`, { headers: authHeader });
    catalog = await resp.json();
  } catch (e) {
    logErrorAndExit(`failed to fetch catalog — ${e.message}`);
  }
  console.log(`models in catalog: ${catalog.data.length}`);
}

main().catch((e) => {
  console.error(`UNEXPECTED: ${e.message}`);
  process.exit(2);
});


