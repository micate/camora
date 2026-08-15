#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const extensionId = process.argv[2];
if (!extensionId || !/^[a-p]{32}$/.test(extensionId)) {
  console.error('Usage: camora install-native-host <32-character-extension-id>');
  process.exit(1);
}

const sourceHostPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'camora-native-host.mjs');
// When installed via npm, the package root is the parent of the native-host directory
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

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

const skillSourcePath = path.join(packageRoot, 'skills/camora-rules');
const skillRoot = process.env.CAMORA_SKILLS_HOME
  || path.join(os.homedir(), '.agents', 'skills');
const skillPath = path.join(skillRoot, 'camora-rules');
fs.mkdirSync(path.dirname(skillPath), { recursive: true });
fs.cpSync(skillSourcePath, skillPath, { recursive: true, force: true });

console.log(JSON.stringify({
  success: true,
  manifestPath,
  hostPath: installedHostPath,
  launcherPath,
  skillPath,
  nextStep: 'Restart Chrome, or toggle Camora off and on in chrome://extensions, then start an agent session that loads skills from ~/.agents/skills.',
}, null, 2));
