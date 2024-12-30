import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ConfigProvider, theme } from 'antd'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      componentSize="small"
      theme={{
        "token": {
          "fontSize": 12,
          "sizeStep": 4,
          "borderRadius": 4,
          "wireframe": true
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
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>,
)
