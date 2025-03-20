import { updateStatus } from './updateStatus';

let updateTimeout: NodeJS.Timeout | null = null;

export function updateCount() {
  if (updateTimeout) {
    clearTimeout(updateTimeout);
  }
  updateTimeout = setTimeout(() => {
    Promise.all([
      chrome.storage.local.get('enabled'),
      chrome.declarativeNetRequest.getDynamicRules(),
    ]).then(([{ enabled }, rules]) => {
      if (enabled) {
        chrome.action.setBadgeText({ text: rules.length.toString() });
        chrome.action.setBadgeBackgroundColor({ color: "rgb(22, 104, 220)" });
      } else {
        updateStatus(false);
      }
    });
  }, 1000);
};
