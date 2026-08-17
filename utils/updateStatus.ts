export function updateStatus(enabled: boolean, count?: number) {
  if (enabled && count !== undefined && count > 0) {
    chrome.action.setBadgeText({ text: count.toString() });
    chrome.action.setBadgeBackgroundColor({ color: "rgb(22, 104, 220)" });
  } else if (enabled) {
    // 启用状态但没有规则
    chrome.action.setBadgeText({ text: '' });
    chrome.action.setBadgeBackgroundColor({ color: "rgb(22, 104, 220)" });
  } else {
    chrome.action.setBadgeText({ text: "OFF" });
    chrome.action.setBadgeBackgroundColor({ color: "rgba(255, 255, 255, 0.25)" });
  }
}
