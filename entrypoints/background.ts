
import { updateStatus } from '../utils/updateStatus';
import { getAndApplyRules } from '../utils/getAndApplyRules';
import { updateDynamicRules } from '../utils/updateDynamicRules';
import { backup, handleBackupAlarm } from '../utils/cloud';

export default defineBackground(() => {

  // MV3 listeners are registered once during service-worker initialization.
  chrome.alarms.onAlarm.addListener(handleBackupAlarm);

  // 监听规则变化
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      // 总开关改变
      if (changes.enabled) {
        const isEnabled = changes.enabled.newValue;
        if (isEnabled) {
          // 获取规则组并设置动态规则，updateDynamicRules 完成后会更新徽标
          chrome.storage.local.get(['groups']).then(({ groups }) => {
            updateDynamicRules(groups || []);
          });
        } else {
          // 禁用状态：清空动态规则并显示 OFF
          updateDynamicRules([]);
        }
        return;
      }

      // 规则改变
      if (changes.groups) {
        const newGroups = changes.groups.newValue || [];
        // 获取当前启用状态，updateDynamicRules 完成后会更新徽标
        chrome.storage.local.get(['enabled']).then(({ enabled }) => {
          const isEnabled = enabled === undefined ? false : enabled;
          if (isEnabled) {
            updateDynamicRules(newGroups);
          } else {
            updateDynamicRules([]);
          }
        });

        backup();
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

  // 添加扩展启动时的处理
  chrome.runtime.onStartup.addListener(() => {
    getAndApplyRules();
  });

  // 初始化规则
  getAndApplyRules();

  // 监听来自 Popup 等内部页面的消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'doBackup') {
      backup(true).then(() => sendResponse('Backup complete'));
      return true;
    }
    return false;
  });

});
