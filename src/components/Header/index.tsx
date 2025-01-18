import { useEffect, useState } from "react";
import { Button, Progress, Space, Switch, AutoComplete, Badge, Tooltip } from "antd";
import { CodeOutlined, PlusOutlined } from "@ant-design/icons";
import SourceView from "../SourceView";
import { useRulesUsage } from "../../hooks/useRulesUsage";
import { RuleGroup } from "../../types";
import "./index.less";

interface IHeaderProps {
  activeGroup?: RuleGroup | null;
  onAddGroup: () => void;
  onChangeActiveGroup: (groupId: string) => void;
}

export default function Header(props: IHeaderProps) {
  const { activeGroup, onAddGroup, onChangeActiveGroup } = props;
  const [enabled, setEnabled] = useState<boolean>(false);
  const { rulesCountPercent, regexRulesCountPercent, rulesFormat, regexRulesFormat } = useRulesUsage()
  const [completeOptions, setCompleteOptions] = useState<{ label: string, value: string }[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [sourceViewVisible, setSourceViewVisible] = useState<boolean>(false);

  useEffect(() => {
    chrome.storage.local.get(['enabled']).then(({ enabled: savedEnabled }) => {
      setEnabled(savedEnabled);
    });
  }, []);

  const handleViewSource = () => {
    setSourceViewVisible(true);
  }

  const handleToggleRule = () => {
    const newEnabled = !enabled
    setEnabled(newEnabled);
    chrome.storage.local.set({ enabled: newEnabled });
  };

  return (
    <div className="app-header">
      <div className="app-header-main">
        <div className="app-search">
          <AutoComplete
            size="small"
            placeholder={chrome.i18n.getMessage('search_placeholder')}
            allowClear
            popupMatchSelectWidth={false}
            notFoundContent="No results"
            options={completeOptions}
            filterOption={(inputValue, option) =>
              option?.label.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
            }
            onDropdownVisibleChange={(open) => {
              if (open) {
                chrome.storage.local.get('groups').then(({ groups }) => {
                  const options = groups.map((group: RuleGroup) => ({ label: group.name, value: group.id }));
                  setCompleteOptions(options);
                });
              } else {
                setCompleteOptions([]);
              }
            }}
            value={inputValue}
            onChange={setInputValue}
            onSelect={(value) => {
              onChangeActiveGroup(value);
              setInputValue('');
            }}
            style={{ width: '100%' }}
          />
        </div>
        <Tooltip title={chrome.i18n.getMessage('import_export')} placement="bottom">
          <Button
            size="small"
            icon={<CodeOutlined />}
            onClick={handleViewSource}
          />
        </Tooltip>
        <Tooltip title={chrome.i18n.getMessage('add_group')} placement="bottom">
          <Button
            size="small"
            type="primary"
            icon={<PlusOutlined />}
            onClick={onAddGroup}
          />
        </Tooltip>
      </div>
      <div className="app-header-secondary">
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
        <div className="app-active-group">
          {activeGroup ? (
            <Space size="small" direction="horizontal">
              {activeGroup.enabled ? (
                <Badge status="processing" />
              ) : (
                <Badge status="default" />
              )}
              {activeGroup?.name}
            </Space>
          ) : null}
        </div>
        <div className="app-switch">
          <Switch size="default" checked={enabled} onChange={handleToggleRule} />
        </div>
      </div>
      <SourceView
        visible={sourceViewVisible}
        onClose={() => setSourceViewVisible(false)}
      />
    </div>
  )
}
