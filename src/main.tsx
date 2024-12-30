import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import App from './App'

const language = chrome.i18n.getUILanguage();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      componentSize="small"
      theme={{
        "token": {
          "fontSize": 12,
          "sizeStep": 4,
          "borderRadius": 4,
          "wireframe": false
        },
        "components": {
          "Modal": {
            "titleFontSize": 12,
            "titleLineHeight": 1.2,
            "controlHeight": 28,
            "algorithm": true
          }
        },
        "algorithm": theme.compactAlgorithm
      }}
      locale={language === 'zh-CN' ? zhCN : enUS}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>,
)
