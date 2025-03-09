import { useEffect, useState } from "react";
import { Button, Progress, Space, Tooltip } from "antd";
import { CodeOutlined, FullscreenOutlined, ReadOutlined, SettingOutlined } from "@ant-design/icons";
import SourceView from "../SourceView";
import Setting from "../Setting";
import { useRulesUsage } from "../../hooks/useRulesUsage";
import "./index.less";

interface IFooterProps { }

export default function Header(props: IFooterProps) {
  const { rulesCountPercent, regexRulesCountPercent, rulesFormat, regexRulesFormat } = useRulesUsage()
  const [sourceViewVisible, setSourceViewVisible] = useState<boolean>(false)
  const [settingVisible, setSettingVisible] = useState<boolean>(false)
  const [enableSourceMap, setEnableSourceMap] = useState<boolean>(false)

  useEffect(() => {
    chrome.storage.local.get(['enableSourceMap'], ({ enableSourceMap }) => {
      setEnableSourceMap(!!enableSourceMap);
    });

    const onChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.enableSourceMap) {
        setEnableSourceMap(!!changes.enableSourceMap.newValue);
      }
    };

    chrome.storage.onChanged.addListener(onChange);
    return () => {
      chrome.storage.onChanged.removeListener(onChange);
    }
  }, []);

  const handleViewSource = () => {
    setSourceViewVisible(true);
  }

  const handleViewSetting = () => {
    setSettingVisible(true);
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
        <div className="app-source-map-status">
          {enableSourceMap ? (
            <Tooltip title={chrome.i18n.getMessage('source_map_enabled')} placement="top">
              <ReadOutlined
                style={{ color: 'var(--ant-color-info)' }}
                onClick={() => {
                  setSettingVisible(true);
                }}
              />
            </Tooltip>
          ) : (
            <Tooltip title={chrome.i18n.getMessage('source_map_disabled')} placement="top">
              <ReadOutlined
                style={{ color: 'var(--ant-color-text)' }}
                onClick={() => {
                  setSettingVisible(true);
                }}
              />
            </Tooltip>
          )}
        </div>
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
              // strokeColor={conicColors}
              format={rulesFormat}
            />
            <Progress
              type="circle"
              size={12}
              percent={regexRulesCountPercent}
              // strokeColor={conicColors}
              // trailColor="#f0f0f0"
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
        visible={sourceViewVisible}
        onClose={() => setSourceViewVisible(false)}
      />
      <Setting
        visible={settingVisible}
        onClose={() => setSettingVisible(false)}
      />
    </div>
  )
}
