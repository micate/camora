#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'camora-host-test-'));
const socketPath = path.join(directory, 'rules.sock');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const host = spawn(process.execPath, [path.join(root, 'packages/camora-cli/native-host/camora-native-host.mjs')], {
  env: { ...process.env, CAMORA_RULES_SOCKET: socketPath },
  stdio: ['pipe', 'pipe', 'inherit'],
});

let buffer = Buffer.alloc(0);
host.stdout.on('data', (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);
  if (buffer.length < 4) return;
  const length = buffer.readUInt32LE(0);
  if (buffer.length < length + 4) return;
  const request = JSON.parse(buffer.subarray(4, length + 4).toString('utf8'));
  const response = Buffer.from(JSON.stringify({
    kind: 'response',
    requestId: request.requestId,
    result: { enabled: false, groups: [], revision: 3 },
  }));
  const header = Buffer.alloc(4);
  header.writeUInt32LE(response.length, 0);
  host.stdin.write(Buffer.concat([header, response]));
});

for (let attempt = 0; attempt < 100 && !fs.existsSync(socketPath); attempt += 1) {
  await new Promise((resolve) => setTimeout(resolve, 20));
}
assert.ok(fs.existsSync(socketPath), 'Native host socket was not created');

const cli = spawn(process.execPath, [path.join(root, 'packages/camora-cli/skills/camora-rules/scripts/camora.mjs'), 'app', 'get'], {
  env: { ...process.env, CAMORA_RULES_SOCKET: socketPath },
});
let output = '';
for await (const chunk of cli.stdout) output += chunk;
const exitCode = await new Promise((resolve) => cli.on('close', resolve));
assert.equal(exitCode, 0);
assert.deepEqual(JSON.parse(output), { enabled: false, groups: [], revision: 3 });

host.kill('SIGTERM');
await new Promise((resolve) => host.on('close', resolve));
fs.rmSync(directory, { recursive: true });
console.log('Native host and Camora CLI smoke test passed.');
