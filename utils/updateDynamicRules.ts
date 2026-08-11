import { CorsRule, Rule, RuleGroup, RuleType, RedirectRule, SourceMapRule } from '../types'
import { getEnabledRules } from './getEnabledRules'
import { updateCount } from './updateCount'
import {
  CREDENTIAL_CORS_ALLOW_HEADERS,
  CREDENTIAL_CORS_ALLOW_METHODS,
  DEFAULT_CORS_ALLOW_HEADERS,
  DEFAULT_CORS_ALLOW_METHODS,
  DEFAULT_CORS_ALLOW_ORIGIN,
  DEFAULT_CORS_MAX_AGE,
} from './corsDefaults'

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

function createCorsAction(rule: CorsRule): chrome.declarativeNetRequest.RuleAction {
  const responseHeaders: chrome.declarativeNetRequest.ModifyHeaderInfo[] = [];
  const addHeader = (header: string, value: string | number | undefined) => {
    if (value === undefined || value === '') return;
    responseHeaders.push({
      header,
      operation: chrome.declarativeNetRequest.HeaderOperation.SET,
      value: String(value),
    });
  };

  addHeader(
    'Access-Control-Allow-Origin',
    rule.allowCredentials ? rule.allowOrigin : DEFAULT_CORS_ALLOW_ORIGIN,
  );
  if (rule.allowCredentials) {
    addHeader('Access-Control-Allow-Credentials', 'true');
  }
  addHeader(
    'Access-Control-Allow-Methods',
    rule.allowCredentials ? CREDENTIAL_CORS_ALLOW_METHODS : DEFAULT_CORS_ALLOW_METHODS,
  );
  addHeader(
    'Access-Control-Allow-Headers',
    rule.allowCredentials ? CREDENTIAL_CORS_ALLOW_HEADERS : DEFAULT_CORS_ALLOW_HEADERS,
  );
  addHeader('Access-Control-Max-Age', rule.maxAge ?? DEFAULT_CORS_MAX_AGE);

  return {
    type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
    responseHeaders,
  };
}

async function applyDynamicRules(ruleGroups: RuleGroup[]) {
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

    if (type === RuleType.CORS) {
      return {
        id: index + 1,
        priority: 1,
        action: createCorsAction(rule as CorsRule),
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
            chrome.declarativeNetRequest.ResourceType.MEDIA,
          ],
        },
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

// Service worker can receive several storage events before a DNR update finishes.
// Serialize them so an older snapshot can never overwrite a newer one.
let updateQueue: Promise<void> = Promise.resolve();

export function updateDynamicRules(ruleGroups: RuleGroup[]) {
  updateQueue = updateQueue.then(
    () => applyDynamicRules(ruleGroups),
    () => applyDynamicRules(ruleGroups),
  );
  return updateQueue;
}
