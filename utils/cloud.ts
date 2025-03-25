import { message } from 'antd';
import { RuleGroup } from "../types";
import { cleanupGroups } from "./cleanupGroups";
import { getRulesCount } from './getRulesCount';
import { getCurrentTime } from './getCurrentTime';

const BackupInterval = 300000;

let timeout: NodeJS.Timeout | null = null;
export function backup() {
  if (timeout) {
    clearTimeout(timeout);
  }

  timeout = setTimeout(() => {
    chrome.storage.local.get(['enableBackup', 'groups']).then(({ enableBackup, groups }) => {
      if (!enableBackup) {
        return;
      }
      const cleanedGroups = cleanupGroups(groups, true);
      createBackup(cleanedGroups);
    });
  }, BackupInterval);
}

export function getBackupKey() {
  return `backup_${getCurrentTime()}`;
}

export async function createBackup(groups: RuleGroup[]) {
  try {
    const { backupItems } = await chrome.storage.sync.get('backupItems');

    // 确保备份数据不重复
    if (backupItems?.length) {
      const lastBackup = backupItems[backupItems.length - 1];
      const lastBackupData = await getBackupData(lastBackup.key);
      if (JSON.stringify(lastBackupData) === JSON.stringify(groups)) {
        return;
      }
    }

    const backupKey = getBackupKey();
    const rulesCount = getRulesCount(groups);
    await chrome.storage.sync.set({
      backupItems: [...(backupItems || []), { key: backupKey, count: rulesCount }],
      [backupKey]: groups,
    });
    return true;
  } catch (error: any) {
    const msg = chrome.i18n.getMessage('create_backup_failed', error.message);
    console.error(msg);
    message.error(msg);
  }
  return false;
}

export async function getBackupList() {
  const { backupItems } = await chrome.storage.sync.get('backupItems');
  return backupItems || [];
}

export async function getBackupData(key: string) {
  const { [key]: data } = await chrome.storage.sync.get(key);
  return data;
}

export async function deleteBackup(key: string) {
  await chrome.storage.sync.remove(key);
  // 删除备份后，更新 backupItems
  const { backupItems } = await chrome.storage.sync.get('backupItems');
  const updatedBackupItems = (backupItems || []).filter((item: any) => item.key !== key);
  await chrome.storage.sync.set({ backupItems: updatedBackupItems });
  return true;
}