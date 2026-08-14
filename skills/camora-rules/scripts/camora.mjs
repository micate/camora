#!/usr/bin/env node

import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import crypto from 'node:crypto';

const argv = process.argv.slice(2);

function usage(message) {
  if (message) console.error(message);
  console.error(`Usage:
  camora app get|enable|disable [--revision N]
  camora group list|get|create|update|delete|enable|disable [ID] [options]
  camora rule list|get|validate|create|update|delete|enable|disable [ID] [options]

Write options: --revision N (required), --confirm (required for delete)
Create rule:  --group ID --type redirect|sourceMap|cors --source VALUE [--target VALUE]
Update rule:  --patch JSON
Raw escape hatch: camora call ACTION --input JSON`);
  process.exit(2);
}

function parse(input) {
  const positionals = [];
  const options = {};
  for (let index = 0; index < input.length; index += 1) {
    const value = input[index];
    if (!value.startsWith('--')) {
      positionals.push(value);
      continue;
    }
    const key = value.slice(2);
    if (key === 'confirm') {
      options.confirm = true;
      continue;
    }
    const next = input[index + 1];
    if (!next || next.startsWith('--')) usage(`Missing value for --${key}`);
    options[key] = next;
    index += 1;
  }
  return { positionals, options };
}

function number(value, name) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) usage(`--${name} must be an integer`);
  return parsed;
}

function json(value, name) {
  try { return JSON.parse(value); } catch { usage(`--${name} must contain valid JSON`); }
}

function commandFromArgs() {
  const { positionals, options } = parse(argv);
  const [resource, operation, id] = positionals;
  if (!resource || !operation) usage();

  const base = {
    requestId: options['request-id'] || crypto.randomUUID(),
    ...(options.revision === undefined ? {} : { expectedRevision: number(options.revision, 'revision') }),
    ...(options.confirm ? { confirm: true } : {}),
  };

  if (resource === 'call') {
    return { ...base, action: operation, ...(options.input ? json(options.input, 'input') : {}) };
  }
  if (resource === 'app') {
    if (operation === 'get') return { action: 'app.get' };
    if (operation === 'enable' || operation === 'disable') {
      return { ...base, action: 'app.setEnabled', enabled: operation === 'enable' };
    }
  }
  if (resource === 'group') {
    if (operation === 'list') return { action: 'group.list' };
    if (operation === 'get') return { action: 'group.get', groupId: id };
    if (operation === 'create') return { ...base, action: 'group.create', name: options.name };
    if (operation === 'update') return { ...base, action: 'group.update', groupId: id, name: options.name };
    if (operation === 'delete') return { ...base, action: 'group.delete', groupId: id };
    if (operation === 'enable' || operation === 'disable') {
      return { ...base, action: 'group.setEnabled', groupId: id, enabled: operation === 'enable' };
    }
  }
  if (resource === 'rule') {
    if (operation === 'list') return { action: 'rule.list', ...(options.group ? { groupId: options.group } : {}) };
    if (operation === 'get') return { action: 'rule.get', ruleId: id };
    if (operation === 'validate') return { action: 'rule.validate', rule: json(options.rule, 'rule') };
    if (operation === 'create') {
      const rule = options.rule ? json(options.rule, 'rule') : {
        type: options.type || 'redirect',
        source: options.source,
        ...(options['source-type'] ? { sourceType: options['source-type'] } : {}),
        ...(options.target ? { target: options.target } : {}),
        ...(options['target-type'] ? { targetType: options['target-type'] } : {}),
        ...(options['source-map-url'] ? { sourceMapUrl: options['source-map-url'] } : {}),
      };
      return { ...base, action: 'rule.create', groupId: options.group, rule };
    }
    if (operation === 'update') return { ...base, action: 'rule.update', ruleId: id, patch: json(options.patch, 'patch') };
    if (operation === 'delete') return { ...base, action: 'rule.delete', ruleId: id };
    if (operation === 'enable' || operation === 'disable') {
      return { ...base, action: 'rule.setEnabled', ruleId: id, enabled: operation === 'enable' };
    }
  }
  usage(`Unknown command: ${resource} ${operation}`);
}

const socketPath = process.env.CAMORA_RULES_SOCKET
  || path.join(os.tmpdir(), `camora-rules-${process.getuid?.() ?? 'user'}.sock`);
const command = commandFromArgs();
const socket = net.createConnection(socketPath);
let response = '';

socket.setEncoding('utf8');
socket.on('connect', () => socket.write(`${JSON.stringify(command)}\n`));
socket.on('data', (chunk) => { response += chunk; });
socket.on('end', () => {
  try {
    const parsed = JSON.parse(response.trim());
    console.log(JSON.stringify(parsed.error ? parsed : parsed.result, null, 2));
    if (parsed.error) process.exitCode = 1;
  } catch {
    console.error(JSON.stringify({ error: { code: 'INVALID_HOST_RESPONSE', message: response.trim() } }, null, 2));
    process.exitCode = 1;
  }
});
socket.on('error', (error) => {
  console.error(JSON.stringify({
    error: {
      code: 'HOST_UNAVAILABLE',
      message: `Camora native host is unavailable at ${socketPath}: ${error.message}. Install the host and reload Camora.`,
    },
  }, null, 2));
  process.exitCode = 1;
});
