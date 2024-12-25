import { Rule, RuleGroup } from '../types'

// 监听规则变化
chrome.storage.onChanged.addListener((changes) => {
  if (changes.rules) {
    updateDynamicRules(changes.rules.newValue)
  }
})

// 更新动态规则
async function updateDynamicRules(ruleGroups: RuleGroup[]) {
  const rules: Rule[] = [];
  for (const group of ruleGroups) {
    if (group.enabled) {
      for (const rule of group.rules) {
        if (rule.enabled) {
          rules.push(rule);
        }
      }
    }
  }

  console.info('rules', rules);
  
  // 移除所有现有规则
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules()
  const existingRuleIds = existingRules.map(rule => rule.id)
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existingRuleIds,
    addRules: rules.map((rule, index) => ({
      id: index + 1,
      priority: 1,
      action: {
        type: 'redirect',
        redirect: { url: rule.target }
      },
      condition: {
        urlFilter: rule.source,
        resourceTypes: ['script', 'stylesheet']
      }
    }))
  })
}

// 初始化规则
chrome.storage.local.get('rules').then(({ rules = [] }) => {
  updateDynamicRules(rules)
})
