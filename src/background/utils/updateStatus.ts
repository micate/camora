export function updateStatus(enabled: boolean) {
  if (enabled) {
    chrome.action.setBadgeText({ text: '' });
    chrome.action.setBadgeBackgroundColor({ color: "rgb(22, 104, 220)" });
  } else {
    chrome.action.setBadgeText({ text: "OFF" });
    chrome.action.setBadgeBackgroundColor({ color: "rgba(255, 255, 255, 0.25)" });
  }
}