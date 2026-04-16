import { useState, useEffect } from "react";
import { App, Button, Modal, Progress, Space, Tooltip } from "antd";
import { CodeOutlined, FullscreenOutlined, SettingOutlined, SyncOutlined } from "@ant-design/icons";
import SourceView from "../SourceView";
import Setting from "../Setting";
import { useRulesUsage } from "../../hooks/useRulesUsage";
import "./index.less";

export default function Footer() {
  const { rulesCountPercent, regexRulesCountPercent, rulesFormat, regexRulesFormat } = useRulesUsage()
  const [sourceViewVisible, setSourceViewVisible] = useState<boolean>(false)
  const [settingVisible, setSettingVisible] = useState<boolean>(false)
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<number>(0);
  const { message } = App.useApp();

  // Listen for sync results from background script
  useEffect(() => {
    const listener = (msg: any) => {
      if (msg.action === 'syncResult') {
        if (msg.success) {
          message.success(msg.message || '同步成功');
        } else {
          message.error(msg.message || '同步失败');
        }
      }
    };
    
    chrome.runtime.onMessage.addListener(listener);
    return () => {
      chrome.runtime.onMessage.removeListener(listener);
    };
  }, [message]);

  const handleViewSource = () => {
    setSourceViewVisible(true);
  }

  const handleViewSetting = () => {
    setSettingVisible(true);
  }

  const handleSync = () => {
    setSyncing(true);
    setSyncProgress(0);
    
    chrome.runtime.sendMessage({ action: "manualSync" }, (response) => {
      setSyncing(false);
      setSyncProgress(0);
      
      if (response?.success) {
        message.success(response.message || '同步成功');
      } else {
        message.error(response?.message || '同步失败');
      }
    });
  }

  return (
    <div className="app-footer">
      <div className="app-footer-main">
        <div className="app-settings">
          <Button
            size="small"
            color="default"
            variant="filled"
            icon={<SettingOutlined />}
            onClick={handleViewSetting}
          />
        </div>
        <Tooltip title={chrome.i18n.getMessage('sync_now') || '同步'} placement="bottom">
          <Button
            size="small"
            color="default"
            variant="filled"
            icon={<SyncOutlined spin={syncing} />}
            onClick={handleSync}
            loading={syncing}
          />
        </Tooltip>
        <Tooltip title={chrome.i18n.getMessage('import_export')} placement="bottom">
          <Button
            size="small"
            color="default"
            variant="filled"
            icon={<CodeOutlined />}
            onClick={handleViewSource}
          />
        </Tooltip>
      </div>
      <div className="app-footer-secondary">
        <div className="app-quick-actions">
          <Space size="small" direction="horizontal">
            <Progress
              type="circle"
              size={16}
              percent={rulesCountPercent}
              format={rulesFormat}
            />
            <Progress
              type="circle"
              size={12}
              percent={regexRulesCountPercent}
              format={regexRulesFormat}
            />
          </Space>
        </div>
        <div className="app-footer-right-actions">
          <Button
            size="small"
            color="default"
            variant="filled"
            icon={<FullscreenOutlined />}
            onClick={() => {
              window.open(location.href)
            }}
          />
        </div>
      </div>
      <SourceView
        open={sourceViewVisible}
        onClose={() => setSourceViewVisible(false)}
      />
      <Setting
        open={settingVisible}
        onClose={() => setSettingVisible(false)}
      />
    </div>
  )
}
