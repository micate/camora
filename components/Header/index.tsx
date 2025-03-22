import { useEffect, useState } from "react";
import { Button, Space, Switch, AutoComplete, Badge, Tooltip } from "antd";
import { PlusOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import Help from "../Help";
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
  const [completeOptions, setCompleteOptions] = useState<{ label: string, value: string }[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [helpVisible, setHelpVisible] = useState<boolean>(false);

  useEffect(() => {
    chrome.storage.local.get(['enabled']).then(({ enabled: savedEnabled }) => {
      setEnabled(savedEnabled);
    });
  }, []);

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
            notFoundContent={chrome.i18n.getMessage('no_results')}
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
        <div className="app-help">
          <QuestionCircleOutlined
            style={{
              color: 'var(--ant-color-text)',
              fontSize: '16px',
              cursor: 'pointer',
            }}
            onClick={() => {
              setHelpVisible(true);
            }}
          />
          <Help
            visible={helpVisible}
            onClose={() => setHelpVisible(false)}
          />
        </div>
        <div className="app-active-group">
          <div className="app-active-group-name">
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
        </div>
        <div className="app-switch">
          <Switch size="default" checked={enabled} onChange={handleToggleRule} />
        </div>
      </div>
    </div>
  )
}
