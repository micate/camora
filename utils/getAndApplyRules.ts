import { updateDynamicRules } from './updateDynamicRules';
import { updateStatus } from './updateStatus';

// 提取获取存储数据并应用规则的函数
export function getAndApplyRules() {
  return chrome.storage.local.get(['enabled', 'groups']).then(({ enabled, groups }) => {
    const isEnabled = enabled === undefined ? false : enabled;
    const ruleGroups = groups || [];
    
    // 先更新状态为启用/禁用，具体规则数量由 updateDynamicRules 完成后更新
    updateStatus(isEnabled);

    if (isEnabled) {
      updateDynamicRules(ruleGroups);
    } else {
      // 即使禁用状态，也需要更新规则（清空）和徽标显示
      updateDynamicRules([]);
    }

    return { isEnabled, groups: ruleGroups };
  });
};