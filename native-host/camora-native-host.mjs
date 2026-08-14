#!/usr/bin/env node

import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

const socketPath = process.env.CAMORA_RULES_SOCKET
  || path.join(os.tmpdir(), `camora-rules-${process.getuid?.() ?? 'user'}.sock`);
const pending = new Map();
let nativeBuffer = Buffer.alloc(0);

function writeNative(message) {
  const body = Buffer.from(JSON.stringify(message));
  const header = Buffer.alloc(4);
  header.writeUInt32LE(body.length, 0);
  process.stdout.write(Buffer.concat([header, body]));
}

function handleNative(message) {
  if (message?.kind !== 'response' || !message.requestId) return;
  const request = pending.get(message.requestId);
  if (!request) return;
  pending.delete(message.requestId);
  clearTimeout(request.timer);
  request.socket.end(`${JSON.stringify(message.error ? { error: message.error } : { result: message.result })}\n`);
}

process.stdin.on('data', (chunk) => {
  nativeBuffer = Buffer.concat([nativeBuffer, chunk]);
  while (nativeBuffer.length >= 4) {
    const length = nativeBuffer.readUInt32LE(0);
    if (length > 8 * 1024 * 1024) process.exit(2);
    if (nativeBuffer.length < length + 4) break;
    const body = nativeBuffer.subarray(4, length + 4);
    nativeBuffer = nativeBuffer.subarray(length + 4);
    try {
      handleNative(JSON.parse(body.toString('utf8')));
    } catch {
      // Ignore malformed messages from the extension process.
    }
  }
});

if (fs.existsSync(socketPath)) {
  if (!fs.lstatSync(socketPath).isSocket()) {
    process.stderr.write(`Refusing to replace non-socket path: ${socketPath}\n`);
    process.exit(2);
  }
  fs.unlinkSync(socketPath);
}

const server = net.createServer((socket) => {
  let input = '';
  socket.setEncoding('utf8');
  socket.on('data', (chunk) => {
    input += chunk;
    if (input.length > 1024 * 1024) socket.destroy(new Error('Request is too large'));
    const newline = input.indexOf('\n');
    if (newline < 0) return;

    try {
      const command = JSON.parse(input.slice(0, newline));
      const requestId = crypto.randomUUID();
      const timer = setTimeout(() => {
        pending.delete(requestId);
        socket.end(`${JSON.stringify({ error: { code: 'TIMEOUT', message: 'Camora extension did not respond' } })}\n`);
      }, 15_000);
      pending.set(requestId, { socket, timer });
      writeNative({ kind: 'request', requestId, command });
    } catch (error) {
      socket.end(`${JSON.stringify({ error: { code: 'INVALID_REQUEST', message: error.message } })}\n`);
    }
  });
});

server.on('error', (error) => {
  process.stderr.write(`Camora native host socket error: ${error.message}\n`);
  process.exit(2);
});

server.listen(socketPath, () => fs.chmodSync(socketPath, 0o600));

function shutdown() {
  for (const request of pending.values()) {
    clearTimeout(request.timer);
    request.socket.end(`${JSON.stringify({ error: { code: 'HOST_STOPPED', message: 'Native host stopped' } })}\n`);
  }
  server.close(() => {
    if (fs.existsSync(socketPath)) fs.unlinkSync(socketPath);
    process.exit(0);
  });
}

process.stdin.on('end', shutdown);
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
