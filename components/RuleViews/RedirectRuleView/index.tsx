import { useState } from 'react';
import { Space, Input, Button, Divider, Switch, Popconfirm, Tooltip } from 'antd';
import { SearchOutlined, CopyOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { RedirectRule } from '../../../types';
import { uniqueId } from '../../../utils/uniqueId';
import { determineFilterType, determineRedirectType } from '../../../utils/determineInputType';
import './index.less';

interface IRuleViewProps {
  rule: RedirectRule;
  onChange: (rule: RedirectRule) => void;
  onCopyRule: (rule: RedirectRule) => void;
  onDelete: () => void;
}

export default function RedirectRuleView(props: IRuleViewProps) {
  const { rule, onChange, onCopyRule, onDelete } = props;
  const { source, target } = rule || {};
  const [draftSource, setDraftSource] = useState(source);
  const [draftTarget, setDraftTarget] = useState(target);

  const handleSourceChange = () => {
    if (draftSource === source) {
      return;
    }
    const sourceType = determineFilterType(draftSource).type;
    onChange({ ...rule, source: draftSource, sourceType })
  };

  const handleTargetChange = () => {
    if (draftTarget === target) {
      return;
    }
    const targetType = determineRedirectType(draftTarget).type;
    onChange({ ...rule, target: draftTarget, targetType });
  };

  const handleCopyRule = () => {
    const newRule = { ...rule };
    newRule.id = uniqueId('rule');
    onCopyRule(newRule);
  };

  const handleToggleRule = (checked: boolean) => {
    onChange({ ...rule, enabled: checked });
  };

  return (
    <div className={`rule-view ${rule.enabled ? 'rule-view-enabled' : 'rule-view-disabled'}`}>
      <Space className="rule-view-content" size="small" direction="vertical">
        <div className="rule-view-source">
          <Input
            addonBefore={(
              <a
                target="_blank"
                href="https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest#url_filter_syntax"
                style={{ cursor: 'help' }}
              >
                <SearchOutlined />
              </a>
            )}
            size="small"
            value={draftSource}
            onChange={(e) => setDraftSource(e.target.value)}
            onPressEnter={handleSourceChange}
            onBlur={handleSourceChange}
          />
        </div>
        <div className="rule-view-target">
          <Input
            addonBefore={(
              <a
                target="_blank"
                href="https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest#url_filter_syntax"
                style={{ cursor: 'help' }}
              >
                <EditOutlined />
              </a>
            )}
            size="small"
            value={draftTarget}
            onChange={(e) => setDraftTarget(e.target.value)}
            onPressEnter={handleTargetChange}
            onBlur={handleTargetChange}
          />
          <Space className="rule-view-actions" size="small" direction="horizontal">
            <Tooltip title={chrome.i18n.getMessage('copy_rule')} placement="top">
              <Button size="small" icon={<CopyOutlined />} onClick={handleCopyRule} />
            </Tooltip>
            <Popconfirm
              title={chrome.i18n.getMessage('delete_rule')}
              description={chrome.i18n.getMessage('delete_rule_confirmation')}
              onConfirm={onDelete}
              placement="bottom"
            >
              <Tooltip title={chrome.i18n.getMessage('delete_rule')} placement="top">
                <Button size="small" icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
            <Divider type="vertical" />
            <Switch checked={rule.enabled} onChange={handleToggleRule} />
          </Space>
        </div>
      </Space>
    </div>
  );
}