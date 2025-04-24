import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import App from './App'
import { useDarkMode } from '../../hooks/useDarkMode';

const language = chrome.i18n.getUILanguage();

function Main() {
  const darkMode = useDarkMode();

  return (
    <React.StrictMode>
      <ConfigProvider
        componentSize="small"
        theme={{
          "cssVar": true,
          "token": {
            "fontSize": 14,
            "sizeStep": 4,
            "borderRadius": 4,
            "wireframe": false,
            "controlInteractiveSize": 16,
          },
          "components": {
            "Modal": {
              "titleFontSize": 12,
              "titleLineHeight": 1.2,
              "controlHeight": 28,
              "algorithm": true
            }
          },
          "algorithm": darkMode ? [theme.darkAlgorithm, theme.compactAlgorithm] : theme.compactAlgorithm
          // "algorithm": theme.compactAlgorithm
        }}
        locale={language === 'zh-CN' ? zhCN : enUS}
      >
        <App />
      </ConfigProvider>
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Main />,
)
