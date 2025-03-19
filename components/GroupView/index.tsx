import { useEffect, useState } from 'react';
import { Space, Empty, Dropdown, MenuProps, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import RedirectRuleView from '../RuleViews/RedirectRuleView';
import SourceMapRuleView from '../RuleViews/SourceMapRuleView';
import { RedirectRule, Rule, RuleGroup, RuleType, SourceMapRule } from '../../types';
import { createRule } from '../../utils/createRule';
import './index.less';

interface IGroupViewProps {
  group: RuleGroup;
  onChange: (group: RuleGroup) => void;
}

export default function GroupView(props: IGroupViewProps) {
  const { group, onChange } = props;
  const { rules } = group || {};
  const [showSourceMap, setShowSourceMap] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(['enableSourceMap'], ({ enableSourceMap }) => {
      setShowSourceMap(enableSourceMap)
    });

    const onChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.enableSourceMap) {
        setShowSourceMap(!!changes.enableSourceMap.newValue);
      }
    };

    chrome.storage.onChanged.addListener(onChange);
    return () => {
      chrome.storage.onChanged.removeListener(onChange);
    }
  }, []);

  const menuItems: MenuProps['items'] = [
    showSourceMap ? {
      key: 'addSourceMap',
      label: chrome.i18n.getMessage('add_source_map'),
      onClick: () => {
        handleAddRule({
          type: RuleType.SourceMap,
        });
      },
    } : null,
  ].filter(Boolean);

  const handleAddRule = (data?: Partial<Rule>) => {
    const newRule = createRule(data);
    onChange({ ...group, rules: [...rules, newRule] });
  };

  const handleRuleChange = (rule: Rule) => {
    rule.type = rule.type || RuleType.Redirect;
    onChange({
      ...group,
      rules: rules.map((r) => (r.id === rule.id ? rule : r)),
    });
  };

  const handleCopyRule = (rule: Rule) => {
    rule.type = rule.type || RuleType.Redirect;
    onChange({
      ...group,
      rules: [...rules, rule],
    });
  };

  const handleDeleteRule = (ruleId: string) => {
    onChange({
      ...group,
      rules: rules.filter((r) => r.id !== ruleId),
    });
  };

  const addBtn = menuItems.length ? (
    <Dropdown.Button
      menu={{ items: menuItems }}
      placement="bottom"
      autoAdjustOverflow
      size="small"
      onClick={() => {
        handleAddRule({ type: RuleType.Redirect });
      }}
    >
      <PlusOutlined />
    </Dropdown.Button>
  ) : (
    <Button size="small" onClick={() => handleAddRule({ type: RuleType.Redirect })}>
      <PlusOutlined />
    </Button>
  );

  return (
    <div className="group-view">
      {rules?.length ? (
        <Space
          className="group-view-content"
          size="large"
          direction="vertical"
        >
          {(rules || []).map((rule) => {
            if (rule.type === RuleType.SourceMap) {
              return (
                <SourceMapRuleView
                  key={rule.id}
                  rule={rule as SourceMapRule}
                  onChange={handleRuleChange}
                  onCopyRule={handleCopyRule}
                  onDelete={() => handleDeleteRule(rule.id)}
                />
              );
            }
            return (
              <RedirectRuleView
                key={rule.id}
                rule={rule as RedirectRule}
                onChange={handleRuleChange}
                onCopyRule={handleCopyRule}
                onDelete={() => handleDeleteRule(rule.id)}
              />
            );
          })}
          <div className="group-view-actions">
            {addBtn}
          </div>
        </Space>
      ) : (
        <Space className="group-view-content group-view-empty" size="small" direction="vertical">
          <Empty description={false}>
            {addBtn}
          </Empty>
        </Space>
      )}
    </div>
  );
}
