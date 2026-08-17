import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Space, Switch, AutoComplete, Badge, Tooltip } from "antd";
import { PlusOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import Help from "../Help";
import type { RuleGroup } from "../../types";
import "./index.less";

interface IHeaderProps {
  activeGroup?: RuleGroup | null;
  onAddGroup: () => void;
  onChangeActiveGroup: (groupId: string) => void;
}

export default function Header(props: IHeaderProps) {
  const { activeGroup, onAddGroup, onChangeActiveGroup } = props;
  const [enabled, setEnabled] = useState<boolean>(false);
  const [enabledLoading, setEnabledLoading] = useState<boolean>(true);
  const [enabledSaving, setEnabledSaving] = useState<boolean>(false);
  const [completeOptions, setCompleteOptions] = useState<{ label: string, value: string }[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [helpVisible, setHelpVisible] = useState<boolean>(false);
  const searchRef = useRef<any>(null);
  const enabledRevisionRef = useRef(0);
  const searchCmdTips = navigator.userAgent.includes('Mac OS X') ? 'Cmd+K' : 'Ctrl+K';

  useEffect(() => {
    let mounted = true;

    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ) => {
      if (areaName === 'local' && changes.enabled && mounted) {
        enabledRevisionRef.current += 1;
        setEnabled(Boolean(changes.enabled.newValue));
        setEnabledLoading(false);
      }
    };

    // Register before the initial read so a startup-time storage change cannot
    // happen between reading the value and subscribing to future updates.
    chrome.storage.onChanged.addListener(handleStorageChange);
    const revisionAtRead = enabledRevisionRef.current;
    chrome.storage.local.get(['enabled'])
      .then(({ enabled: savedEnabled }) => {
        if (mounted && enabledRevisionRef.current === revisionAtRead) {
          setEnabled(Boolean(savedEnabled));
        }
      })
      .catch((error) => {
        console.error('Failed to read extension enabled state:', error);
      })
      .finally(() => {
        if (mounted) {
          setEnabledLoading(false);
        }
      });

    return () => {
      mounted = false;
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const openSearch = useCallback(() => {
    searchRef.current?.focus?.();
    chrome.storage.local.get('groups').then(({ groups = [] }) => {
      setCompleteOptions(
        groups.map((group: RuleGroup) => ({ label: group.name, value: group.id })),
      );
      setSearchOpen(true);
    });
  }, []);

  // cmd + k / ctrl + k 键盘快捷键
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        openSearch();
      }
    }
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
    }
  }, [openSearch]);

  const handleToggleRule = async (checked: boolean) => {
    const previousEnabled = enabled;
    setEnabled(checked);
    setEnabledSaving(true);

    try {
      await chrome.storage.local.set({ enabled: checked });
    } catch (error) {
      console.error('Failed to save extension enabled state:', error);
      setEnabled(previousEnabled);
    } finally {
      setEnabledSaving(false);
    }
  };

  return (
    <div className="app-header">
      <div className="app-header-main">
        <div className="app-search">
          <AutoComplete
            ref={searchRef}
            size="small"
            placeholder={`${chrome.i18n.getMessage('search_placeholder')} (${searchCmdTips})`}
            allowClear
            popupMatchSelectWidth={false}
            notFoundContent={chrome.i18n.getMessage('no_results')}
            options={completeOptions}
            open={searchOpen}
            filterOption={(inputValue, option) =>
              option?.label.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
            }
            onOpenChange={(open) => {
              if (open) {
                openSearch();
              } else {
                setSearchOpen(false);
                setCompleteOptions([]);
              }
            }}
            value={inputValue}
            onChange={setInputValue}
            onSelect={(value) => {
              onChangeActiveGroup(value);
              setInputValue('');
              setSearchOpen(false);
            }}
            style={{ width: '100%' }}
            defaultActiveFirstOption
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
            open={helpVisible}
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
          <Switch
            size="default"
            checked={enabled}
            loading={enabledLoading || enabledSaving}
            disabled={enabledLoading || enabledSaving}
            onChange={handleToggleRule}
          />
        </div>
      </div>
    </div>
  )
}
