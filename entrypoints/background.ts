
import { updateStatus } from '../utils/updateStatus';
import { getAndApplyRules } from '../utils/getAndApplyRules';
import { updateDynamicRules } from '../utils/updateDynamicRules';
import { backup } from '../utils/cloud';
import { RuleGroup, Rule, RuleType } from '../types';
import { uniqueId } from '../utils/uniqueId';

// Native Messaging 协议消息类型（与 mcp-server/src/types.ts 保持一致）
type NativeMessageAction =
  | 'listGroups'
  | 'createGroup'
  | 'deleteGroup'
  | 'toggleGroup'
  | 'createRule'
  | 'updateRule'
  | 'deleteRule'
  | 'toggleRule'

interface NativeRequest {
  id: string
  action: NativeMessageAction
  payload?: Record<string, unknown>
}

interface NativeResponse {
  id: string
  success: boolean
  data?: unknown
  error?: string
}

/**
 * 处理来自 MCP Server 的 Native Messaging 命令
 * 所有操作直接读写 chrome.storage.local，storage 变化监听器会自动触发规则更新
 */
async function handleNativeMessage(request: NativeRequest): Promise<NativeResponse> {
  const { id, action, payload = {} } = request

  try {
    const { groups = [] } = await chrome.storage.local.get(['groups']) as { groups: RuleGroup[] }

    switch (action) {
      case 'listGroups': {
        return { id, success: true, data: groups }
      }

      case 'createGroup': {
        const { name } = payload as { name: string }
        if (!name) {
          return { id, success: false, error: '缺少必填参数：name' }
        }
        const newGroup: RuleGroup = {
          id: uniqueId('group'),
          name,
          rules: [],
          enabled: true,
        }
        const updatedGroups = [...groups, newGroup]
        await chrome.storage.local.set({ groups: updatedGroups })
        return { id, success: true, data: newGroup }
      }

      case 'deleteGroup': {
        const { groupId } = payload as { groupId: string }
        if (!groupId) {
          return { id, success: false, error: '缺少必填参数：groupId' }
        }
        const groupExists = groups.some((group) => group.id === groupId)
        if (!groupExists) {
          return { id, success: false, error: `规则组 "${groupId}" 不存在` }
        }
        const updatedGroups = groups.filter((group) => group.id !== groupId)
        await chrome.storage.local.set({ groups: updatedGroups })
        return { id, success: true }
      }

      case 'toggleGroup': {
        const { groupId, enabled } = payload as { groupId: string; enabled: boolean }
        if (!groupId || enabled === undefined) {
          return { id, success: false, error: '缺少必填参数：groupId 或 enabled' }
        }
        const updatedGroups = groups.map((group) =>
          group.id === groupId ? { ...group, enabled } : group
        )
        await chrome.storage.local.set({ groups: updatedGroups })
        return { id, success: true }
      }

      case 'createRule': {
        const { groupId, ruleData } = payload as { groupId: string; ruleData: Partial<Rule> }
        if (!groupId || !ruleData) {
          return { id, success: false, error: '缺少必填参数：groupId 或 ruleData' }
        }
        const targetGroup = groups.find((group) => group.id === groupId)
        if (!targetGroup) {
          return { id, success: false, error: `规则组 "${groupId}" 不存在` }
        }
        const newRule: Rule = {
          ...ruleData,
          id: uniqueId('rule'),
          type: ruleData.type ?? RuleType.Redirect,
          source: ruleData.source ?? '',
          enabled: true,
        } as Rule
        const updatedGroups = groups.map((group) =>
          group.id === groupId
            ? { ...group, rules: [...group.rules, newRule] }
            : group
        )
        await chrome.storage.local.set({ groups: updatedGroups })
        return { id, success: true, data: newRule }
      }

      case 'updateRule': {
        const { groupId, ruleId, updates } = payload as {
          groupId: string
          ruleId: string
          updates: Partial<Rule>
        }
        if (!groupId || !ruleId || !updates) {
          return { id, success: false, error: '缺少必填参数：groupId、ruleId 或 updates' }
        }
        let updatedRule: Rule | undefined
        const updatedGroups = groups.map((group) => {
          if (group.id !== groupId) return group
          return {
            ...group,
            rules: group.rules.map((rule) => {
              if (rule.id !== ruleId) return rule
              updatedRule = { ...rule, ...updates, id: rule.id, type: rule.type } as Rule
              return updatedRule
            }),
          }
        })
        if (!updatedRule) {
          return { id, success: false, error: `规则 "${ruleId}" 在组 "${groupId}" 中不存在` }
        }
        await chrome.storage.local.set({ groups: updatedGroups })
        return { id, success: true, data: updatedRule }
      }

      case 'deleteRule': {
        const { groupId, ruleId } = payload as { groupId: string; ruleId: string }
        if (!groupId || !ruleId) {
          return { id, success: false, error: '缺少必填参数：groupId 或 ruleId' }
        }
        let ruleFound = false
        const updatedGroups = groups.map((group) => {
          if (group.id !== groupId) return group
          const filteredRules = group.rules.filter((rule) => {
            if (rule.id === ruleId) {
              ruleFound = true
              return false
            }
            return true
          })
          return { ...group, rules: filteredRules }
        })
        if (!ruleFound) {
          return { id, success: false, error: `规则 "${ruleId}" 在组 "${groupId}" 中不存在` }
        }
        await chrome.storage.local.set({ groups: updatedGroups })
        return { id, success: true }
      }

      case 'toggleRule': {
        const { groupId, ruleId, enabled } = payload as {
          groupId: string
          ruleId: string
          enabled: boolean
        }
        if (!groupId || !ruleId || enabled === undefined) {
          return { id, success: false, error: '缺少必填参数：groupId、ruleId 或 enabled' }
        }
        let ruleFound = false
        const updatedGroups = groups.map((group) => {
          if (group.id !== groupId) return group
          return {
            ...group,
            rules: group.rules.map((rule) => {
              if (rule.id !== ruleId) return rule
              ruleFound = true
              return { ...rule, enabled }
            }),
          }
        })
        if (!ruleFound) {
          return { id, success: false, error: `规则 "${ruleId}" 在组 "${groupId}" 中不存在` }
        }
        await chrome.storage.local.set({ groups: updatedGroups })
        return { id, success: true }
      }

      default:
        return { id, success: false, error: `未知操作：${action}` }
    }
  } catch (error) {
    return { id, success: false, error: String(error) }
  }
}

export default defineBackground(() => {

  // 监听规则变化
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      // 总开关改变
      if (changes.enabled) {
        const isEnabled = changes.enabled.newValue;
        if (isEnabled) {
          // 获取规则组并设置动态规则，updateDynamicRules 完成后会更新徽标
          chrome.storage.local.get(['groups']).then(({ groups }) => {
            updateDynamicRules(groups || []);
          });
        } else {
          // 禁用状态：清空动态规则并显示 OFF
          updateDynamicRules([]);
        }
        return;
      }

      // 规则改变
      if (changes.groups) {
        const newGroups = changes.groups.newValue || [];
        // 获取当前启用状态，updateDynamicRules 完成后会更新徽标
        chrome.storage.local.get(['enabled']).then(({ enabled }) => {
          const isEnabled = enabled === undefined ? false : enabled;
          if (isEnabled) {
            updateDynamicRules(newGroups);
          } else {
            updateDynamicRules([]);
          }
        });
      }

      backup();
    }
  })

  // 添加扩展安装和更新时的处理
  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
      // 新安装时设置默认状态
      chrome.storage.local.set({ enabled: false, groups: [] });
      updateStatus(false);
    } else if (details.reason === 'update') {
      // 更新时确保状态正确
      getAndApplyRules();
    }
  });

  // 添加扩展启动时的处理
  chrome.runtime.onStartup.addListener(() => {
    getAndApplyRules();
    // Check for sync updates after 5 seconds delay
    setTimeout(checkForUpdates, 5000);
  });

  // Initialize rules
  getAndApplyRules();

  // Listen for messages from Popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'doBackup') {
      backup(true);
      sendResponse('Backup start');
    } else if (message.action === 'manualSync') {
      handleManualSync().then(sendResponse);
      return true; // Keep channel open for async response
    } else if (message.action === 'clearSyncBadge') {
      clearSyncBadge();
      sendResponse({ success: true });
    }
    return true;
  });

  // Listen for connections from MCP Server
  chrome.runtime.onConnectExternal.addListener((port) => {
    if (port.name !== 'camora-mcp') return

    port.onMessage.addListener(async (message: NativeRequest) => {
      const response = await handleNativeMessage(message)
      port.postMessage(response)
    })

    port.onDisconnect.addListener(() => {
      console.log('MCP Server 断开连接')
    })
  })

});

// Sync functionality

async function handleManualSync(): Promise<{ success: boolean; message: string }> {
  const { syncUrl, syncMode } = await chrome.storage.local.get(['syncUrl', 'syncMode']);
  
  if (!syncUrl) {
    return { success: false, message: '请先配置同步 URL' };
  }
  
  try {
    const { performSync } = await import('../utils/sync');
    const result = await performSync(syncUrl, syncMode || 'merge_remote');
    return result;
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

/**
 * Check for remote updates without syncing
 * Returns true if there are updates available
 */
async function checkForUpdates(): Promise<boolean> {
  const { syncEnabled, syncUrl, syncMode } = await chrome.storage.local.get(['syncEnabled', 'syncUrl', 'syncMode']);
  
  if (!syncEnabled || !syncUrl) {
    return false;
  }
  
  try {
    const { fetchRemoteRules, calculateDiff } = await import('../utils/sync');
    const remoteGroups = await fetchRemoteRules(syncUrl);
    
    // Get local groups
    const { groups: localGroups = [] } = await chrome.storage.local.get(['groups']);
    
    // Calculate diff
    const diff = calculateDiff(localGroups, remoteGroups);
    
    const hasUpdates = diff.added > 0 || diff.deleted > 0 || diff.updated > 0;
    
    // Store update status
    await chrome.storage.local.set({ 
      syncUpdateAvailable: hasUpdates,
      syncLastChecked: Date.now(),
      syncDiff: diff
    });
    
    // Notify popup about update availability
    if (hasUpdates) {
      chrome.runtime.sendMessage({ 
        action: 'syncUpdateAvailable',
        hasUpdates: true,
        diff: diff
      });
    }
    
    return hasUpdates;
  } catch (error) {
    console.error('Sync check failed:', error);
    return false;
  }
}

function clearSyncBadge() {
  chrome.storage.local.set({ syncUpdateAvailable: false });
}
