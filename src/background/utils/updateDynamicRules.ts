import { Rule, RuleGroup, RuleType, RedirectRule, SourceMapRule } from "../../types"
import { getEnabledRules } from '../../utils/getEnabledRules'
import { updateCount } from "./updateCount"

// 更新动态规则
export async function updateDynamicRules(ruleGroups: RuleGroup[]) {
  // 找到所有启用的规则
  const rules = getEnabledRules(ruleGroups)
  console.log('Enabled input rules', rules)

  // 移除所有现有规则
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules()
  const existingRuleIds = existingRules.map(rule => rule.id)

  // 转化为 Chrome 声明性网络请求规则
  const netRequestRules = rules.map((rule: Rule, index: number) => {
    const { type, source, sourceType } = rule;

    if (type === RuleType.SourceMap) {
      const { sourceMapUrl } = rule as SourceMapRule;
      return {
        id: index + 1,
        priority: 1,
        action: {
          type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
          responseHeaders: [
            {
              header: 'SourceMap',
              operation: chrome.declarativeNetRequest.HeaderOperation.SET,
              value: sourceMapUrl
            }
          ]
        },
        condition: {
          [sourceType || 'urlFilter']: source,
          resourceTypes: [
            chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
            chrome.declarativeNetRequest.ResourceType.SUB_FRAME,
            chrome.declarativeNetRequest.ResourceType.STYLESHEET,
            chrome.declarativeNetRequest.ResourceType.SCRIPT,
            chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
          ]
        }
      };
    }

    const { target, targetType } = rule as RedirectRule;
    return {
      id: index + 1,
      priority: 1,
      action: {
        type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
        redirect: { [targetType || 'url']: target }
      },
      condition: {
        [sourceType || 'urlFilter']: source,
        resourceTypes: [
          chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
          chrome.declarativeNetRequest.ResourceType.SUB_FRAME,
          chrome.declarativeNetRequest.ResourceType.STYLESHEET,
          chrome.declarativeNetRequest.ResourceType.SCRIPT,
          chrome.declarativeNetRequest.ResourceType.IMAGE,
          chrome.declarativeNetRequest.ResourceType.FONT,
          chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
          chrome.declarativeNetRequest.ResourceType.CSP_REPORT,
          chrome.declarativeNetRequest.ResourceType.MEDIA,
        ]
      }
    };
  }).filter(Boolean)
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

  updateCount();
}