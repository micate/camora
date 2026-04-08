import { RuleGroup } from '../types';

export function updateStatus(enabled: boolean, groups?: RuleGroup[]) {
  if (enabled && groups) {
    // 统计启用规则数量
    const enabledRulesCount = groups.reduce((count, group) => {
      if (!group.enabled) return count;
      return count + (group.rules?.filter(rule => rule.enabled).length || 0);
    }, 0);

    if (enabledRulesCount > 0) {
      chrome.action.setBadgeText({ text: enabledRulesCount.toString() });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
    chrome.action.setBadgeBackgroundColor({ color: "rgb(22, 104, 220)" });
  } else {
    chrome.action.setBadgeText({ text: "OFF" });
    chrome.action.setBadgeBackgroundColor({ color: "rgba(255, 255, 255, 0.25)" });
  }
}
