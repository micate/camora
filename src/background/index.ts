import { Rule, RuleGroup } from '../types'

// 监听规则变化
chrome.storage.onChanged.addListener((changes) => {
  if (changes.groups) {
    updateDynamicRules(changes.groups.newValue)
  }
})

// 更新动态规则
async function updateDynamicRules(ruleGroups: RuleGroup[]) {
  const rules: Rule[] = [];
  for (const group of ruleGroups) {
    if (group.enabled) {
      for (const rule of group.rules) {
        if (rule.enabled && rule.source && rule.target) {
          rules.push(rule);
        }
      }
    }
  }

  console.info('rules', rules);
  
  // 移除所有现有规则
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules()
  const existingRuleIds = existingRules.map(rule => rule.id)
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existingRuleIds,
    addRules: rules.map((rule, index) => {
      const { source, sourceType, target, targetType} = rule;
      return {
        id: index + 1,
        priority: 1,
        action: {
          type: 'redirect',
          redirect: { [targetType || 'url']: target }
        },
        condition: {
          [sourceType || 'urlFilter']: source,
          resourceTypes: ['script', 'stylesheet']
        }
      };
    })
  })
}

// 初始化规则
chrome.storage.local.get('groups').then(({ groups }) => {
  updateDynamicRules(groups)
})
