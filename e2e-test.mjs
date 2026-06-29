#!/usr/bin/env node
/**
 * DnD Yemot Handler - E2E smoke test
 *
 * Seeds a minimal game (start → choice → end) then walks two paths.
 * Uses docker exec for DB operations and built-in fetch for HTTP.
 *
 * Usage: cd dnd-management-nra && node e2e-test.mjs
 */

import { execSync } from 'child_process';
import crypto from 'crypto';

const SERVER = 'http://localhost:3041/yemot/handle-call';
const DID    = '0772222770';   // ApiDID → user.phoneNumber
const PHONE  = '0521234567';

// ─── DB helpers ──────────────────────────────────────────────────────────────

function sql(query) {
  return execSync(
    `docker exec dnd-database-dev mysql --default-character-set=utf8mb4 -u mysql_user -pmysql_password dnd_management_nra -e "${query.replace(/"/g, '\\"')}"`,
    { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
  );
}

function seed() {
  sql('SET FOREIGN_KEY_CHECKS=0; TRUNCATE routing_rules; TRUNCATE choices; TRUNCATE nodes; TRUNCATE segments; TRUNCATE users; SET FOREIGN_KEY_CHECKS=1');
  sql(`INSERT INTO users (id, name, phone_number) VALUES (1, 'Test User', '${DID}')`);
  sql(`INSERT INTO segments (id, user_id, name, title, value) VALUES
    (1, 1, 'start-intro',      'Intro',     'ברוכים הבאים למשחק DnD'),
    (2, 1, 'choice-direction', 'Direction', 'לאן תרצה ללכת? הקש 1 לצפון הקש 2 לדרום'),
    (3, 1, 'end-north',        'North',     'הלכת צפונה ומצאת אוצר ניצחת'),
    (4, 1, 'end-south',        'South',     'הלכת דרומה ונפלת לבור הפסדת')`);
  sql(`INSERT INTO nodes (id, user_id, name, segmentId, nodeType) VALUES
    (1, 1, 'start',            1, 'start'),
    (2, 1, 'choose-direction', 2,  NULL),
    (3, 1, 'north-end',        3, 'end'),
    (4, 1, 'south-end',        4, 'end')`);
  sql(`INSERT INTO choices (id, user_id, nodeId, inputKey, description) VALUES
    (1, 1, 2, 1, 'north'),
    (2, 1, 2, 2, 'south')`);
  sql(`INSERT INTO routing_rules (user_id, sourceNodeId, choiceId, targetNodeId) VALUES
    (1, 1, NULL, 2),
    (1, 2,    1, 3),
    (1, 2,    2, 4)`);
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

function callUrl(params) {
  return `${SERVER}?${new URLSearchParams(params).toString()}`;
}

function newParams() {
  return {
    ApiCallId:    crypto.randomBytes(10).toString('hex'),
    ApiYFCallId:  crypto.randomBytes(10).toString('hex'),
    ApiDID:       DID,
    ApiRealDID:   DID,
    ApiPhone:     PHONE,
    ApiExtension: '',
    ApiTime:      Date.now().toString(),
  };
}

async function yemotGet(params) {
  const res    = await fetch(callUrl(params));
  const buf    = await res.arrayBuffer();
  const text   = new TextDecoder('utf-8').decode(buf);
  return { status: res.status, text };
}

// ─── Assertions ───────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function check(label, actual, predicate) {
  const ok = typeof predicate === 'function' ? predicate(actual) : actual === predicate;
  if (ok) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label} — got: ${JSON.stringify(actual).slice(0, 200)}`);
    failed++;
  }
}

// ─── Test cases ───────────────────────────────────────────────────────────────

async function testNorthPath() {
  console.log('\n[A] start → choice(1) → north-end (win)');
  const p = newParams();

  const r1 = await yemotGet(p);
  check('status 200',                  r1.status, 200);
  check('intro segment in response',   r1.text,   t => t.includes('ברוכים הבאים') || t.includes('%D7%91%D7%A8%D7%95%D7%9B%D7%99%D7%9D'));
  check('direction question or read',  r1.text,   t => t.includes('read=') || t.includes('לאן'));

  p.val_1 = '1';
  const r2 = await yemotGet(p);
  check('status 200',              r2.status, 200);
  check('north-end text (win)',    r2.text,   t => t.includes('ניצחת') || t.includes('%D7%A0%D7%99%D7%A6%D7%97%D7%AA'));
  check('no further read prompt', r2.text,   t => !t.match(/^read=/));
}

async function testSouthPath() {
  console.log('\n[B] start → choice(2) → south-end (lose)');
  const p = newParams();

  const r1 = await yemotGet(p);
  check('status 200',             r1.status, 200);
  check('gets direction prompt',  r1.text,   t => t.includes('read='));

  p.val_1 = '2';
  const r2 = await yemotGet(p);
  check('status 200',            r2.status, 200);
  check('south-end text (lose)', r2.text,   t => t.includes('הפסדת') || t.includes('%D7%94%D7%A4%D7%A1%D7%93%D7%AA'));
}

async function testUnknownUser() {
  console.log('\n[C] Unknown DID → hangup with system message');
  const p = { ...newParams(), ApiDID: '0599999999', ApiRealDID: '0599999999' };

  const r1 = await yemotGet(p);
  check('status 200',                     r1.status, 200);
  check('hangup response (no read=)',      r1.text,   t => !t.includes('read='));
  check('contains system message text',   r1.text,   t =>
    t.includes('מחוברת') || t.includes('DND.') || t.includes('id_list_message'));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log('Seeding test data...');
seed();
console.log('Done.\n');

await testNorthPath();
await testSouthPath();
await testUnknownUser();

console.log(`\n${'─'.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
