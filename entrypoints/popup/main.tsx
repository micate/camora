import React from 'react'
import ReactDOM from 'react-dom/client'
import { App as AntdApp, ConfigProvider, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import jaJP from 'antd/locale/ja_JP';
import App from './App'
import { useDarkMode } from '../../hooks/useDarkMode';

const language = chrome.i18n.getUILanguage();
const locales: Record<string, any> = {
  "zh-CN": zhCN,
  "en-US": enUS,
  "ja": jaJP,
}

function Main() {
  const darkMode = useDarkMode();

  return (
    <React.StrictMode>
      <ConfigProvider
        componentSize="small"
        theme={{
          "cssVar": { key: "camora" },
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
        locale={locales[language] || enUS}
      >
        <AntdApp>
          <App />
        </AntdApp>
      </ConfigProvider>
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Main />,
)
