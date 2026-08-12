import { useState } from "react";
import { Button, Progress, Space, Tooltip } from "antd";
import { CodeOutlined, FullscreenOutlined, SettingOutlined } from "@ant-design/icons";
import SourceView from "../SourceView";
import Setting from "../Setting";
import { useRulesUsage } from "../../hooks/useRulesUsage";
import "./index.less";

export default function Footer() {
  const { rulesCountPercent, regexRulesCountPercent, rulesFormat, regexRulesFormat } = useRulesUsage()
  const [sourceViewVisible, setSourceViewVisible] = useState<boolean>(false)
  const [settingVisible, setSettingVisible] = useState<boolean>(false)

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
          <Space size="small" direction="horizontal" align="center">
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
