export function updateStatus(enabled: boolean) {
  if (enabled) {
    chrome.action.setBadgeText({ text: '' });
    chrome.action.setBadgeBackgroundColor({ color: "rgb(22, 104, 220)" });
  } else {
    chrome.action.setBadgeText({ text: "OFF" });
    chrome.action.setBadgeBackgroundColor({ color: "rgba(255, 255, 255, 0.25)" });
  }

  // if (count > 0) {
  //   chrome.action.setBadgeText({ text: `${count}` });
  //   chrome.action.setBadgeTextColor({ color: '#FFFFFF' });
  //   chrome.action.setBadgeBackgroundColor({ color: "#0088FF" });
  // } else {
  //   chrome.action.setBadgeText({ text: "" });
  // }

  // const iconPaths = count > 0 ? {
  //   "16": "icon/icon-16.png",
  //   "24": "icon/icon-24.png",
  //   "48": "icon/icon-48.png",
  //   "96": "icon/icon-96.png",
  //   "128": "icon/icon-128.png"
  // } : {
  //   "16": "icon/icon-16-disabled.png",
  //   "24": "icon/icon-24-disabled.png",
  //   "48": "icon/icon-48-disabled.png",
  //   "96": "icon/icon-96-disabled.png",
  //   "128": "icon/icon-128-disabled.png"
  // };
  // chrome.action.setIcon({ path: iconPaths });
}