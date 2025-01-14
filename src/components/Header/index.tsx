import { useEffect, useState } from "react";
import { Button, Progress, Space, Switch, Dropdown, MenuProps, AutoComplete, Badge } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useRulesUsage } from "../../hooks/useRulesUsage";
import { importRules } from "../../utils/importRules";
import { exportRules } from "../../utils/exportRules";
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
  const { rulesCountPercent, regexRulesCountPercent, rulesFormat, regexRulesFormat, conicColors } = useRulesUsage()
  const [completeOptions, setCompleteOptions] = useState<{ label: string, value: string }[]>([]);
  const [inputValue, setInputValue] = useState<string>('');

  useEffect(() => {
    chrome.storage.local.get(['enabled']).then(({ enabled: savedEnabled }) => {
      setEnabled(savedEnabled);
    });
  }, []);

  const menuItems: MenuProps['items'] = [
    {
      key: 'addGroup',
      label: chrome.i18n.getMessage('add_group'),
      onClick: onAddGroup,
    },
    {
      type: 'divider',
    },
    {
      key: 'import',
      label: chrome.i18n.getMessage('import_rules'),
      onClick: importRules,
    },
    {
      key: 'export',
      label: chrome.i18n.getMessage('export_rules'),
      onClick: exportRules,
    },
  ];

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
        <div className="app-menus">
          <Dropdown
            menu={{ items: menuItems }}
            placement="top"
            autoAdjustOverflow
            arrow
          >
            <Button
              size="small"
              type="primary"
              icon={<PlusOutlined />}
              onClick={onAddGroup}
            />
          </Dropdown>
        </div>
      </div>
      <div className="app-header-secondary">
        <div className="app-rules-usage">
          <Space size="small" direction="horizontal">
            <Progress
              type="circle"
              size={16}
              percent={rulesCountPercent}
              strokeColor={conicColors}
              format={rulesFormat}
            />
            <Progress
              type="circle"
              size={14}
              percent={regexRulesCountPercent}
              strokeColor={conicColors}
              trailColor="#f0f0f0"
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
    </div>
  )
}
