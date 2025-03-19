
import { updateStatus } from '../utils/updateStatus';
import { getAndApplyRules } from '../utils/getAndApplyRules';
import { updateDynamicRules } from '../utils/updateDynamicRules';

export default defineBackground(() => {

  // 监听规则变化
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      // 总开关改变
      if (changes.enabled) {
        updateStatus(changes.enabled.newValue)
        if (changes.enabled.newValue) {
          // 设置动态规则
          chrome.storage.local.get(['groups']).then(({ groups }) => {
            updateDynamicRules(groups)
          })
        } else {
          // 清空动态规则
          updateDynamicRules([])
        }
        return;
      }

      // 规则改变
      if (changes.groups) {
        updateDynamicRules(changes.groups.newValue)
      }
    }
  })

  // 添加扩展安装和更新时的处理
  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
      // 新安装时设置默认状态
      chrome.storage.local.set({ enabled: false, groups: [] });
      updateStatus(false);
    } else if (details.reason === 'update') {
      // 更新时确保状态正确
      getAndApplyRules();
    }
  });

  // 初始化规则
  getAndApplyRules();

});