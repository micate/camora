#!/usr/bin/env node
// Camora MCP Server 安装脚本（Node.js 版）
// 由 npm postinstall 钩子自动调用，也可手动执行：node scripts/install.js

import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const EXTENSION_ID = 'mekhlonkhdepfdocpjpkafckjckloahm';
const HOST_NAME = 'com.camora.mcp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scriptDir = path.resolve(__dirname, '..');
const serverEntry = path.join(scriptDir, 'dist', 'index.js');
const templateFile = path.join(scriptDir, 'native-host', 'com.camora.mcp.json.template');
const wrapperScript = path.join(scriptDir, 'native-host', 'camora-mcp-wrapper.sh');

// ── 检测操作系统，确定 Native Messaging Host 注册目录 ──────────────────────

function getNativeHostDirs() {
  const platform = os.platform();
  const homeDir = os.homedir();

  if (platform === 'darwin') {
    return {
      chrome: path.join(homeDir, 'Library', 'Application Support', 'Google', 'Chrome', 'NativeMessagingHosts'),
      chromium: path.join(homeDir, 'Library', 'Application Support', 'Chromium', 'NativeMessagingHosts'),
    };
  }

  if (platform === 'linux') {
    return {
      chrome: path.join(homeDir, '.config', 'google-chrome', 'NativeMessagingHosts'),
      chromium: path.join(homeDir, '.config', 'chromium', 'NativeMessagingHosts'),
    };
  }

  throw new Error(`不支持的操作系统：${platform}（仅支持 macOS 和 Linux）`);
}

// ── 检查构建产物是否存在 ───────────────────────────────────────────────────

function assertBuildExists() {
  if (!fs.existsSync(serverEntry)) {
    console.error(`❌ 找不到构建产物：${serverEntry}`);
    console.error('   请先运行 pnpm build 或 npm run build');
    process.exit(1);
  }
}

// ── 生成包装脚本 ───────────────────────────────────────────────────────────

function writeWrapperScript() {
  const content = [
    '#!/usr/bin/env bash',
    '# Camora MCP Server 启动包装脚本（由 install.js 自动生成）',
    `exec node "${serverEntry}"`,
    '',
  ].join('\n');

  fs.writeFileSync(wrapperScript, content, { mode: 0o755 });
  console.log(`✅ 已生成包装脚本：\n   ${wrapperScript}`);
}

// ── 生成并写入 Native Messaging Host 配置文件 ─────────────────────────────

function writeHostConfig(targetDir) {
  const template = fs.readFileSync(templateFile, 'utf-8');
  const hostJson = template
    .replace(/CAMORA_MCP_SERVER_PATH/g, wrapperScript)
    .replace(/CAMORA_EXTENSION_ID/g, EXTENSION_ID);

  fs.mkdirSync(targetDir, { recursive: true });
  const targetFile = path.join(targetDir, `${HOST_NAME}.json`);
  fs.writeFileSync(targetFile, hostJson, 'utf-8');
  return targetFile;
}

// ── 输出 Claude Desktop 配置提示 ──────────────────────────────────────────

function printClaudeDesktopConfig() {
  const nodeBin = process.execPath;
  const platform = os.platform();
  const configPath =
    platform === 'darwin'
      ? '~/Library/Application Support/Claude/claude_desktop_config.json'
      : '~/.config/Claude/claude_desktop_config.json';

  const configSnippet = JSON.stringify(
    {
      mcpServers: {
        camora: {
          command: nodeBin,
          args: [serverEntry],
        },
      },
    },
    null,
    2,
  );

  console.log('');
  console.log('━'.repeat(62));
  console.log('🤖 Claude Desktop 配置');
  console.log('━'.repeat(62));
  console.log(`配置文件路径：${configPath}`);
  console.log('');
  console.log(configSnippet);
  console.log('');
  console.log('━'.repeat(62));
}

// ── 主流程 ─────────────────────────────────────────────────────────────────

function main() {
  console.log('🔧 注册 Camora Native Messaging Host...');

  assertBuildExists();

  const { chrome: chromeDir, chromium: chromiumDir } = getNativeHostDirs();

  writeWrapperScript();

  // 注册到 Chrome
  const chromeConfigFile = writeHostConfig(chromeDir);
  console.log(`✅ Chrome 配置已写入：\n   ${chromeConfigFile}`);

  // 如果 Chromium 的父目录存在，同样注册
  const chromiumParentDir = path.dirname(chromiumDir);
  if (fs.existsSync(chromiumParentDir)) {
    const chromiumConfigFile = writeHostConfig(chromiumDir);
    console.log(`✅ Chromium 配置已写入：\n   ${chromiumConfigFile}`);
  }

  printClaudeDesktopConfig();

  console.log('🎉 安装完成！');
  console.log('');
  console.log('后续步骤：');
  console.log('  1. 重启 Chrome（确保 Native Messaging Host 生效）');
  console.log('  2. 将上方配置添加到 Claude Desktop 配置文件');
  console.log('  3. 重启 Claude Desktop');
  console.log('━'.repeat(62));
}

main();
