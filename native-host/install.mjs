#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const extensionId = process.argv[2];
if (!extensionId || !/^[a-p]{32}$/.test(extensionId)) {
  console.error('Usage: node native-host/install.mjs <32-character-extension-id>');
  process.exit(1);
}

const sourceHostPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'camora-native-host.mjs');
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let manifestDirectory;
let installDirectory;
if (process.platform === 'darwin') {
  manifestDirectory = path.join(os.homedir(), 'Library/Application Support/Google/Chrome/NativeMessagingHosts');
  installDirectory = path.join(os.homedir(), 'Library/Application Support/Camora/native-host');
} else if (process.platform === 'linux') {
  manifestDirectory = path.join(os.homedir(), '.config/google-chrome/NativeMessagingHosts');
  installDirectory = path.join(os.homedir(), '.local/share/camora/native-host');
} else {
  console.error('Automatic Native Messaging installation currently supports macOS and Linux.');
  process.exit(1);
}

fs.mkdirSync(installDirectory, { recursive: true });
const installedHostPath = path.join(installDirectory, 'camora-native-host.mjs');
const launcherPath = path.join(installDirectory, 'camora-native-host');
fs.copyFileSync(sourceHostPath, installedHostPath);
fs.chmodSync(installedHostPath, 0o644);
const shellQuote = (value) => `'${value.replaceAll("'", `'"'"'`)}'`;
fs.writeFileSync(
  launcherPath,
  `#!/bin/sh\nexec ${shellQuote(process.execPath)} ${shellQuote(installedHostPath)}\n`,
  { mode: 0o755 },
);

fs.mkdirSync(manifestDirectory, { recursive: true });
const manifestPath = path.join(manifestDirectory, 'com.camora.rules.json');
fs.writeFileSync(manifestPath, `${JSON.stringify({
  name: 'com.camora.rules',
  description: 'Local bridge for the Camora rules skill',
  path: launcherPath,
  type: 'stdio',
  allowed_origins: [`chrome-extension://${extensionId}/`],
}, null, 2)}\n`, { mode: 0o600 });

const codexRoot = process.env.CODEX_HOME || path.join(os.homedir(), '.codex');
const skillSourcePath = path.join(repositoryRoot, 'skills/camora-rules');
const skillPath = path.join(codexRoot, 'skills/camora-rules');
fs.mkdirSync(path.dirname(skillPath), { recursive: true });
fs.cpSync(skillSourcePath, skillPath, { recursive: true, force: true });

console.log(JSON.stringify({
  success: true,
  manifestPath,
  hostPath: installedHostPath,
  launcherPath,
  skillPath,
  nextStep: 'Reload Camora in chrome://extensions and start a new Codex task.',
}, null, 2));
