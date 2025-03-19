import { updateDynamicRules } from './updateDynamicRules';
import { updateStatus } from './updateStatus';

// 提取获取存储数据并应用规则的函数
export function getAndApplyRules() {
  return chrome.storage.local.get(['enabled', 'groups']).then(({ enabled, groups }) => {
    const isEnabled = enabled === undefined ? false : enabled;
    updateStatus(isEnabled);

    if (isEnabled) {
      updateDynamicRules(groups || []);
    }

    return { isEnabled, groups: groups || [] };
  });
};