import { compressToBase64, decompressFromBase64 } from "lz-string";
import type { RuleGroup } from "../types";
import { cleanupGroups } from "./cleanupGroups";
import { getRulesCount } from "./getRulesCount";
import { getCurrentTime } from "./getCurrentTime";

export const STORAGE_LIMIT = 102400; // 100 KB
export const BACKUP_ITEM_QUOTA_ERROR = 'backup_item_quota_error';

const BackupDelayMinutes = 3;
const CLEANUP_THRESHOLD = 0.8 * STORAGE_LIMIT; // 80 KB 阈值

function executeBackup() {
  return chrome.storage.local
    .get(["enableBackup", "groups"])
    .then(({ enableBackup, groups = [] }) => {
      if (!enableBackup) return;
      return createBackup(cleanupGroups(groups, true));
    });
}

export function handleBackupAlarm(alarm: chrome.alarms.Alarm) {
  if (alarm.name === 'backup') {
    void executeBackup();
  }
}

export function backup(force = false) {
  if (force) {
    return chrome.alarms.clear('backup').then(() => executeBackup());
  } else {
    return chrome.alarms.clear('backup').then(() => {
      chrome.alarms.create('backup', { delayInMinutes: BackupDelayMinutes });
    });
  }
}

export function getBackupKey() {
  return `backup_${getCurrentTime()}`;
}

export async function createBackup(groups: RuleGroup[]) {
  await checkAndCleanStorage();

  try {
    const { backupItems } = await chrome.storage.sync.get("backupItems");
    const groupStr = JSON.stringify(groups);

    // 确保备份数据不重复
    if (backupItems?.length) {
      const lastBackup = backupItems[backupItems.length - 1];
      const lastBackupData = await getBackupData(lastBackup.key);
      if (JSON.stringify(lastBackupData) === groupStr) {
        return 'same';
      }
    }

    const backupKey = getBackupKey();
    const rulesCount = getRulesCount(groups);
    await chrome.storage.sync.set({
      backupItems: [
        ...(backupItems || []),
        { key: backupKey, count: rulesCount },
      ],
      [backupKey]: compressToBase64(groupStr),
    });
    return true;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // QUOTA_BYTES_PER_ITEM is an expected storage limitation for larger rule
    // sets. Logging it as an error makes Chrome surface it to users on the
    // extension management page, even though the failure is already handled.
    if (/quota.?bytes.?per.?item|kQuotaBytesPerItem/i.test(errorMessage)) {
      return BACKUP_ITEM_QUOTA_ERROR;
    }

    const msg = chrome.i18n.getMessage("create_backup_failed", errorMessage);
    console.error(msg);
    return msg;
  }
}

export async function getBackupList() {
  const { backupItems } = await chrome.storage.sync.get("backupItems");
  return backupItems || [];
}

export async function getBackupData(key: string) {
  const { [key]: data } = await chrome.storage.sync.get(key);
  if (data && typeof data === 'string') {
    const decompressed = decompressFromBase64(data) || data;
    return JSON.parse(decompressed);
  }
  return data;
}

export async function deleteBackup(key: string) {
  await chrome.storage.sync.remove(key);
  // 删除备份后，更新 backupItems
  const { backupItems } = await chrome.storage.sync.get("backupItems");
  const updatedBackupItems = (backupItems || []).filter(
    (item: any) => item.key !== key,
  );
  await chrome.storage.sync.set({ backupItems: updatedBackupItems });
  return true;
}

export async function getBytesInUse() {
  return await chrome.storage.sync.getBytesInUse(null);
}

async function checkAndCleanStorage() {
  const bytesInUse = await getBytesInUse();
  console.log(`当前已使用存储：${bytesInUse} 字节`);

  if (bytesInUse < CLEANUP_THRESHOLD) {
    return;
  }

  console.warn("存储空间接近上限，执行清理...");

  const backupList = await getBackupList();
  if (backupList.length > 0) {
    const half = Math.floor(backupList.length / 2);
    for (let i = 0; i < half; i++) {
      const { key } = backupList[i];
      try {
        await deleteBackup(key);
        console.log(`删除备份：${key}`);
      } catch (error) {
        console.error(`删除备份失败：${key}`, error);
      }
    }
  }
}
