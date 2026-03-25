#!/usr/bin/env node
// Camora MCP Server 卸载脚本（Node.js 版）
// 由 npm preuninstall 钩子自动调用，也可手动执行：node scripts/uninstall.js

import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const HOST_NAME = 'com.camora.mcp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scriptDir = path.resolve(__dirname, '..');
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

// ── 删除单个文件（存在则删，不存在则提示跳过）────────────────────────────

function removeFile(filePath, label) {
  if (fs.existsSync(filePath)) {
    fs.rmSync(filePath);
    console.log(`✅ 已移除 ${label}：\n   ${filePath}`);
    return true;
  }

  console.log(`⚠️  ${label} 不存在，跳过：\n   ${filePath}`);
  return false;
}

// ── 主流程 ─────────────────────────────────────────────────────────────────

function main() {
  console.log('🔧 移除 Camora Native Messaging Host...');

  const { chrome: chromeDir, chromium: chromiumDir } = getNativeHostDirs();

  const chromeHostJson = path.join(chromeDir, `${HOST_NAME}.json`);
  const chromiumHostJson = path.join(chromiumDir, `${HOST_NAME}.json`);

  const removedChrome = removeFile(chromeHostJson, 'Chrome 配置');
  const removedChromium = removeFile(chromiumHostJson, 'Chromium 配置');
  const removedWrapper = removeFile(wrapperScript, '包装脚本');

  const removedAny = removedChrome || removedChromium || removedWrapper;

  console.log('');
  console.log('━'.repeat(62));

  if (removedAny) {
    console.log('🎉 卸载完成！');
  } else {
    console.log('ℹ️  未找到任何已安装的组件，无需卸载。');
  }

  console.log('');
  console.log('后续步骤：');
  console.log('  1. 重启 Chrome（确保 Native Messaging Host 注销生效）');
  console.log('  2. 如已配置 Claude Desktop，请手动移除 claude_desktop_config.json 中的 camora 条目');

  const platform = os.platform();
  const claudeConfigPath =
    platform === 'darwin'
      ? '     ~/Library/Application Support/Claude/claude_desktop_config.json'
      : '     ~/.config/Claude/claude_desktop_config.json';
  console.log(claudeConfigPath);
  console.log('  3. 重启 Claude Desktop');
  console.log('━'.repeat(62));
}

main();
