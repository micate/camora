import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ConfigProvider, theme } from 'antd'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        "token": {
          "fontSize": 12,
          "sizeStep": 4,
          "borderRadius": 4,
          "wireframe": false
        },
        algorithm: theme.compactAlgorithm
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>,
)
