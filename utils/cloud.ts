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
    Promise.all([
      chrome.storage.sync.get('backupItems'),
      chrome.storage.local.get(['enableBackup', 'groups']),
    ]).then(([{ backupItems }, { enableBackup, groups }]) => {
      if (!enableBackup) {
        return;
      }
      const cleanedGroups = cleanupGroups(groups, true);
      if (backupItems?.length) {
        // 之前有过备份
        const lastBackup = backupItems[backupItems.length - 1];
        getBackupData(lastBackup.key).then((data) => {
          if (JSON.stringify(data) !== JSON.stringify(cleanedGroups)) {
            createBackup(cleanedGroups);
          }
        });
      } else if (cleanedGroups?.length) {
        createBackup(cleanedGroups);
      }
    });
  }, BackupInterval);
}

export function getBackupKey() {
  return `backup_${getCurrentTime()}`;
}

export async function createBackup(groups: RuleGroup[]  ) {
  try {
    const { backupItems } = await chrome.storage.sync.get('backupItems');
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