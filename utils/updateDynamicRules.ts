import { Rule, RuleGroup, RuleType, RedirectRule, SourceMapRule } from '../types'
import { getEnabledRules } from './getEnabledRules'
import { updateCount } from './updateCount'

function createRedirectAction(rule: RedirectRule) {
  const { target, targetType } = rule;

  if ((targetType || 'url') === 'regexSubstitution') {
    return {
      type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
      redirect: { regexSubstitution: target },
    };
  }

  try {
    const url = new URL(target);
    const transform: chrome.declarativeNetRequest.URLTransform = {
      scheme: url.protocol.replace(':', ''),
      host: url.hostname,
      path: url.pathname,
    };

    if (url.port) {
      transform.port = url.port;
    }

    if (url.search) {
      transform.query = url.search.slice(1);
    }

    if (url.hash) {
      transform.fragment = url.hash.slice(1);
    }

    if (url.username) {
      transform.username = url.username;
    }

    if (url.password) {
      transform.password = url.password;
    }

    return {
      type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
      redirect: { transform },
    };
  } catch {
    return {
      type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
      redirect: { url: target },
    };
  }
}

// 更新动态规则
export async function updateDynamicRules(ruleGroups: RuleGroup[]) {
  // 找到所有启用的规则
  const rules = getEnabledRules(ruleGroups)
  console.log('Enabled input rules', rules)

  // 移除所有现有规则
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules() || [];
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

    const redirectRule = rule as RedirectRule;
    return {
      id: index + 1,
      priority: 1,
      action: createRedirectAction(redirectRule),
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
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingRuleIds,
      addRules: netRequestRules,
    });
    
    // 规则更新成功后，获取实际生效的规则数量并更新徽标
    const actualRules = await chrome.declarativeNetRequest.getDynamicRules();
    // 根据实际规则数判断：有规则显示数字，无规则且启用状态显示空，但这里无法知道是否启用
    // 所以由调用方决定如何处理禁用状态，这里只处理启用状态下的规则数量
    if (actualRules.length > 0) {
      updateStatus(true, actualRules.length);
    } else {
      // 规则数为 0，可能是禁用了或者没有规则，需要检查存储中的启用状态
      const { enabled } = await chrome.storage.local.get('enabled');
      const isEnabled = enabled === undefined ? false : enabled;
      updateStatus(isEnabled, 0);
    }
  } catch (error) {
    console.error("Failed to add dynamic rules:", error);
    // 发生错误时也尝试获取当前规则数以保持状态准确
    try {
      const actualRules = await chrome.declarativeNetRequest.getDynamicRules();
      if (actualRules.length > 0) {
        updateStatus(true, actualRules.length);
      } else {
        const { enabled } = await chrome.storage.local.get('enabled');
        const isEnabled = enabled === undefined ? false : enabled;
        updateStatus(isEnabled, 0);
      }
    } catch {
      updateStatus(false);
    }
  }

  updateCount(ruleGroups);
}
