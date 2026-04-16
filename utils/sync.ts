import { RuleGroup, Rule } from "../types";
import { cleanupGroups } from "./cleanupGroups";
import { correctIds } from "./correctIds";
import { getCurrentTime } from "./getCurrentTime";

export interface SyncResult {
  success: boolean;
  message: string;
  added?: number;
  deleted?: number;
  updated?: number;
}

export interface SyncProgress {
  current: number;
  total: number;
  status: 'idle' | 'fetching' | 'syncing' | 'complete' | 'error';
  message?: string;
}

/**
 * Fetch remote rules and validate Camora format
 */
export async function fetchRemoteRules(url: string): Promise<RuleGroup[]> {
  const response = await fetch(url, {
    method: 'GET',
    mode: 'cors',
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  const data = await response.json();
  
  // Validate Camora format
  if (!data.vendor || data.vendor !== 'Camora') {
    throw new Error('Invalid format: missing or invalid vendor field');
  }
  if (!data.version) {
    throw new Error('Invalid format: missing version field');
  }
  if (!Array.isArray(data.groups)) {
    throw new Error('Invalid format: missing groups array');
  }
  
  return data.groups;
}

/**
 * Merge remote groups into local groups (remote takes precedence)
 */
export function mergeWithRemotePriority(localGroups: RuleGroup[], remoteGroups: RuleGroup[]): RuleGroup[] {
  const result: RuleGroup[] = [];
  const remoteGroupMap = new Map<string, RuleGroup>();
  
  remoteGroups.forEach(group => {
    remoteGroupMap.set(group.name.toLowerCase(), group);
  });
  
  // Process local groups
  localGroups.forEach(localGroup => {
    const remoteGroup = remoteGroupMap.get(localGroup.name.toLowerCase());
    
    if (remoteGroup) {
      // Remote exists, use remote version but preserve local rule enabled states where possible
      const mergedGroup = { ...remoteGroup };
      mergedGroup.rules = remoteGroup.rules.map(remoteRule => {
        const localRule = localGroup.rules.find(r => r.source === remoteRule.source);
        if (localRule) {
          return { ...remoteRule, enabled: localRule.enabled };
        }
        return remoteRule;
      });
      result.push(mergedGroup);
      remoteGroupMap.delete(localGroup.name.toLowerCase());
    } else {
      // Keep local group that doesn't exist in remote
      result.push(localGroup);
    }
  });
  
  // Add remaining remote groups (new groups from remote)
  remoteGroupMap.forEach(remoteGroup => {
    result.push(remoteGroup);
  });
  
  return correctIds(result);
}

/**
 * Merge remote groups into local groups (local takes precedence)
 */
export function mergeWithLocalPriority(localGroups: RuleGroup[], remoteGroups: RuleGroup[]): RuleGroup[] {
  const result: RuleGroup[] = [...localGroups];
  const localGroupMap = new Map<string, RuleGroup>();
  
  localGroups.forEach(group => {
    localGroupMap.set(group.name.toLowerCase(), group);
  });
  
  // Add remote groups that don't exist locally
  remoteGroups.forEach(remoteGroup => {
    if (!localGroupMap.has(remoteGroup.name.toLowerCase())) {
      result.push(remoteGroup);
    }
  });
  
  return correctIds(result);
}

/**
 * Overwrite local with remote
 */
export function overwriteLocal(remoteGroups: RuleGroup[]): RuleGroup[] {
  return correctIds([...remoteGroups]);
}

/**
 * Calculate diff between two sets of groups
 */
export function calculateDiff(localGroups: RuleGroup[], remoteGroups: RuleGroup[]): { added: number; deleted: number; updated: number } {
  let added = 0;
  let deleted = 0;
  let updated = 0;
  
  const localGroupMap = new Map<string, RuleGroup>();
  localGroups.forEach(g => localGroupMap.set(g.id, g));
  
  const remoteGroupMap = new Map<string, RuleGroup>();
  remoteGroups.forEach(g => remoteGroupMap.set(g.id, g));
  
  // Count added and updated
  remoteGroups.forEach(remoteGroup => {
    const localGroup = localGroupMap.get(remoteGroup.id);
    if (!localGroup) {
      added++;
    } else {
      // Check if rules are different
      const localRulesStr = JSON.stringify(localGroup.rules.sort());
      const remoteRulesStr = JSON.stringify(remoteGroup.rules.sort());
      if (localRulesStr !== remoteRulesStr) {
        updated++;
      }
    }
  });
  
  // Count deleted
  localGroups.forEach(localGroup => {
    if (!remoteGroupMap.has(localGroup.id)) {
      deleted++;
    }
  });
  
  return { added, deleted, updated };
}

/**
 * Perform sync operation
 */
export async function performSync(
  url: string,
  mode: 'overwrite' | 'merge_remote' | 'merge_local',
  onProgress?: (progress: SyncProgress) => void
): Promise<SyncResult> {
  try {
    onProgress?.({ current: 0, total: 100, status: 'fetching', message: '正在获取远程数据...' });
    
    const remoteGroups = await fetchRemoteRules(url);
    
    onProgress?.({ current: 30, total: 100, status: 'syncing', message: '正在处理数据...' });
    
    // Get local groups
    const { groups: localGroups = [] } = await chrome.storage.local.get(['groups']);
    
    // Calculate diff for reporting
    const diff = calculateDiff(localGroups, remoteGroups);
    
    let mergedGroups: RuleGroup[];
    
    switch (mode) {
      case 'overwrite':
        mergedGroups = overwriteLocal(remoteGroups);
        break;
      case 'merge_remote':
        mergedGroups = mergeWithRemotePriority(localGroups, remoteGroups);
        break;
      case 'merge_local':
        mergedGroups = mergeWithLocalPriority(localGroups, remoteGroups);
        break;
      default:
        mergedGroups = mergeWithRemotePriority(localGroups, remoteGroups);
    }
    
    onProgress?.({ current: 70, total: 100, status: 'syncing', message: '正在保存...' });
    
    // Save to storage
    await chrome.storage.local.set({ groups: mergedGroups });
    
    onProgress?.({ current: 100, total: 100, status: 'complete', message: '同步完成' });
    
    // Build result message
    const messages: string[] = [];
    if (diff.added > 0) messages.push(`新增 ${diff.added} 个分组`);
    if (diff.deleted > 0) messages.push(`删除 ${diff.deleted} 个分组`);
    if (diff.updated > 0) messages.push(`更新 ${diff.updated} 个分组`);
    
    return {
      success: true,
      message: messages.length > 0 ? messages.join(', ') : '已是最新',
      added: diff.added,
      deleted: diff.deleted,
      updated: diff.updated,
    };
  } catch (error: any) {
    onProgress?.({ current: 0, total: 100, status: 'error', message: error.message });
    return {
      success: false,
      message: error.message,
    };
  }
}
