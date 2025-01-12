import { getEnabledRules } from '../utils/getEnabledRules'
import { RuleGroup } from '../types'
import { debounce } from '../utils/debounce'

let isSyncing = false;
const syncToChromeStorageSync = debounce(() => {
  if (isSyncing) {
    return;
  }

  isSyncing = true;
  chrome.storage.local.set({ syncStatus: { loading: true } });

  chrome.storage.local.get(['groups']).then(({ groups }) => {
    chrome.storage.sync.set({ groups }, () => {
      if (chrome.runtime.lastError) {
        console.error("Sync error:", chrome.runtime.lastError.message);
        chrome.storage.local.set({ syncStatus: { error: chrome.runtime.lastError.message } });
      } else {
        chrome.storage.local.set({ syncStatus: { success: new Date().toLocaleString() } });
      }

      isSyncing = false;
    })
  })
}, 5000);

const updateBadge = () => {
  Promise.all([
    chrome.storage.local.get('enabled'),
    chrome.declarativeNetRequest.getDynamicRules(),
  ]).then(([{ enabled }, rules]) => {
    if (enabled) {
      chrome.action.setBadgeText({ text: rules.length.toString() });
      chrome.action.setBadgeBackgroundColor({ color: "rgb(22, 104, 220)" });
    } else {
      chrome.action.setBadgeText({ text: "OFF" });
      chrome.action.setBadgeBackgroundColor({ color: "rgba(255, 255, 255, 0.25)" });
    }
  });
};

// 监听规则变化
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') {
    // if (changes.groups) {
    //   syncToChromeStorageSync();
    // }
  
    // 总开关改变
    if (changes.enabled) {
      if (changes.enabled.newValue) {
        // 打开总开关
        chrome.storage.local.get(['groups']).then(({ groups }) => {
          updateDynamicRules(groups)
          updateBadge()
        })
      } else {
        // 关闭总开关
        updateDynamicRules([])
        updateBadge()
      }
      return;
    }
  
    // 规则改变
    if (changes.groups) {
      updateDynamicRules(changes.groups.newValue)
      updateBadge()
    }
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
  updateBadge()
})
