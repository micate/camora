import { getEnabledRules } from '../utils/getEnabledRules'
import { RuleGroup } from '../types'
import { debounce } from '../utils/debounce'

const syncToChromeStorageSync = debounce(() => {
  chrome.storage.local.set({ syncStatus: { loading: true } });
  chrome.storage.local.get(['enabled', 'groups', 'activeGroupId']).then(({ enabled, groups, activeGroupId }) => {
    chrome.storage.sync.set({ enabled, groups, activeGroupId }, () => {
      if (chrome.runtime.lastError) {
        console.error("Sync error:", chrome.runtime.lastError.message);
        chrome.storage.local.set({ syncStatus: { error: chrome.runtime.lastError.message } });
      } else {
        chrome.storage.local.set({ syncStatus: { success: new Date().toLocaleString() } });
      }
    })
  })
}, 2000);

// 监听规则变化
chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled || changes.groups || changes.activeGroupId) {
    syncToChromeStorageSync();
  }

  // 总开关改变
  if (changes.enabled && !changes.enabled.newValue) {
    updateDynamicRules([])
    return;
  }

  // 规则改变
  if (changes.groups) {
    updateDynamicRules(changes.groups.newValue)
  }
})

// 更新动态规则
async function updateDynamicRules(ruleGroups: RuleGroup[]) {
  // 找到所有启用的规则
  const rules = getEnabledRules(ruleGroups)
  console.log('Enabled input rules', rules)

  // 移除所有现有规则
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules()
  const existingRuleIds = existingRules.map(rule => rule.id)

  // 转化为 Chrome 声明性网络请求规则
  const netRequestRules = rules.map((rule, index) => {
    const { source, sourceType, target, targetType } = rule;
    return {
      id: index + 1,
      priority: 1,
      action: {
        type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
        redirect: { [targetType || 'url']: target }
      },
      condition: {
        [sourceType || 'urlFilter']: source,
        resourceTypes: [chrome.declarativeNetRequest.ResourceType.SCRIPT, chrome.declarativeNetRequest.ResourceType.STYLESHEET]
      }
    };
  })
  console.info("Net request rules:", netRequestRules)

  // 添加新规则
  try {
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingRuleIds,
      addRules: netRequestRules,
    })
  } catch (error) {
    console.error("Failed to add dynamic rules:", error);
  }
}

// 初始化规则
chrome.storage.local.get(['enabled', 'groups']).then(({ enabled, groups }) => {
  if (enabled) {
    updateDynamicRules(groups)
  }
})
