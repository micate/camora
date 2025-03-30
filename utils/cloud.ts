import { compressToBase64, decompressFromBase64 } from "lz-string";
import { RuleGroup } from "../types";
import { cleanupGroups } from "./cleanupGroups";
import { getRulesCount } from "./getRulesCount";
import { getCurrentTime } from "./getCurrentTime";

export const STORAGE_LIMIT = 102400; // 100 KB

const BackupDelayMinutes = 3;
const CLEANUP_THRESHOLD = 0.8 * STORAGE_LIMIT; // 80 KB 阈值

export function backup(force = false) {
  chrome.alarms.clear('backup');

  const execute = () => {
    chrome.storage.local
      .get(["enableBackup", "groups"])
      .then(({ enableBackup, groups }) => {
        if (!enableBackup) {
          return;
        }
        const cleanedGroups = cleanupGroups(groups, true);
        createBackup(cleanedGroups);
      });
  };

  if (force) {
    execute();
  } else {
    chrome.alarms.create('backup', { delayInMinutes: BackupDelayMinutes });
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === 'backup') {
        execute();
      }
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
  } catch (error: any) {
    const msg = chrome.i18n.getMessage("create_backup_failed", error.message);
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
