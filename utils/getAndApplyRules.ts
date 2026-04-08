import { updateDynamicRules } from './updateDynamicRules';
import { updateStatus } from './updateStatus';

// 提取获取存储数据并应用规则的函数
export function getAndApplyRules() {
  return chrome.storage.local.get(['enabled', 'groups']).then(({ enabled, groups }) => {
    const isEnabled = enabled === undefined ? false : enabled;
    const ruleGroups = groups || [];
    
    // 传递规则组以便统计启用规则数量
    updateStatus(isEnabled, ruleGroups);

    if (isEnabled) {
      updateDynamicRules(ruleGroups);
    } else {
      // 即使禁用状态，也需要更新徽标显示（显示 OFF 或清空数字）
      updateDynamicRules([]);
    }

    return { isEnabled, groups: ruleGroups };
  });
};