import { useEffect } from "react";

// 深色模式和浅色模式的图标路径
const darkModeIcon = {
  "16": "icons/action-dark-16.png",
  "32": "icons/action-dark-32.png",
  "48": "icons/action-dark-48.png"
};
const lightModeIcon = {
  "16": "icons/action-light-16.png",
  "32": "icons/action-light-32.png",
  "48": "icons/action-light-48.png"
};

export function useIcons() {
  useEffect(() => {
    // 检测主题模式并设置图标
    function updateIcon() {
      chrome.system.display.getInfo(() => {
        const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const iconPath = isDarkMode ? darkModeIcon : lightModeIcon;
        chrome.action.setIcon({ path: iconPath });
      });
    }
    // 初次加载时设置图标
    updateIcon();

    // 监听主题变化事件
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", updateIcon);

    return () => {
      // 清除主题变化事件监听
      window.matchMedia("(prefers-color-scheme: dark)").removeEventListener("change", updateIcon);
    };
  }, []);
}