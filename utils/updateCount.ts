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
      // 直接使用传入的规则组统计启用规则数量，而不是依赖动态规则
      updateStatus(isEnabled, groups);
    });
  }, 100);
};
