import { RuleGroup } from '../types';
import { updateStatus } from './updateStatus';

let updateTimeout: NodeJS.Timeout | null = null;

export function updateCount(groups: RuleGroup[]) {
  if (updateTimeout) {
    clearTimeout(updateTimeout);
  }
  updateTimeout = setTimeout(() => {
    chrome.storage.local.get('enabled').then(({ enabled }) => {
      const isEnabled = enabled === undefined ? false : enabled;
      // 如果启用状态，由 updateDynamicRules 通过 getDynamicRules 获取实际生效的规则数更新徽标
      // 这里只需要在禁用时更新为 OFF 状态
      if (!isEnabled) {
        updateStatus(false);
      }
    });
  }, 100);
};
