import { useState } from 'react';
import type { ReactNode } from 'react';
import { Space, Input, Button, Switch, Popconfirm, Tooltip } from 'antd';
import { SearchOutlined, CopyOutlined, DeleteOutlined, EditOutlined, PlusSquareOutlined } from '@ant-design/icons';
import type { RedirectRule } from '../../../types';
import { determineFilterType, determineRedirectType } from '../../../utils/determineInputType';
import './index.less';

interface IRuleViewProps {
  rule: RedirectRule;
  onChange: (rule: RedirectRule) => void;
  onCopyRule: (rule: RedirectRule) => void;
  onDuplicateRule: (rule: RedirectRule) => void;
  onDelete: () => void;
  dragHandle: ReactNode;
}

export default function RedirectRuleView(props: IRuleViewProps) {
  const { rule, onChange, onCopyRule, onDuplicateRule, onDelete, dragHandle } = props;
  const { source, target } = rule || {};
  const [draftSource, setDraftSource] = useState(source);
  const [draftTarget, setDraftTarget] = useState(target);

  const handleSourceChange = () => {
    if (draftSource === source) {
      return;
    }
    let newSource = draftSource;
    if (draftSource.includes('(') && !draftSource.startsWith('^')) {
      newSource = `^${draftSource}`;
      setDraftSource(newSource);
    }
    const sourceType = determineFilterType(newSource).type;
    onChange({ ...rule, source: newSource, sourceType })
  };

  const handleTargetChange = () => {
    if (draftTarget === target) {
      return;
    }
    let newTarget = draftTarget;
    if (draftTarget.includes('$')) {
      newTarget = draftTarget.replace(/\$(\d+)/g, '\\$1');
      setDraftTarget(newTarget);
    }
    const targetType = determineRedirectType(newTarget).type;
    onChange({ ...rule, target: newTarget, targetType });
  };

  const getRuleSnapshot = () => {
    const nextSource = draftSource.includes('(') && !draftSource.startsWith('^')
      ? `^${draftSource}`
      : draftSource;
    const nextTarget = draftTarget.includes('$')
      ? draftTarget.replace(/\$(\d+)/g, '\\$1')
      : draftTarget;
    return {
      ...rule,
      source: nextSource,
      sourceType: determineFilterType(nextSource).type,
      target: nextTarget,
      targetType: determineRedirectType(nextTarget).type,
    };
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
            placeholder={chrome.i18n.getMessage('redirect_source_placeholder')}
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
            placeholder={chrome.i18n.getMessage('redirect_target_placeholder')}
            value={draftTarget}
            onChange={(e) => setDraftTarget(e.target.value)}
            onPressEnter={handleTargetChange}
            onBlur={handleTargetChange}
          />
          <Space className="rule-view-actions" size="small" direction="horizontal">
            <Tooltip title={chrome.i18n.getMessage('copy_rule')} placement="top">
              <Button size="small" icon={<CopyOutlined />} onClick={() => onCopyRule(getRuleSnapshot())} />
            </Tooltip>
            <Tooltip title={chrome.i18n.getMessage('duplicate_rule')} placement="top">
              <Button size="small" icon={<PlusSquareOutlined />} onClick={() => onDuplicateRule(getRuleSnapshot())} />
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
            {dragHandle}
            <Switch checked={rule.enabled} onChange={handleToggleRule} />
          </Space>
        </div>
      </Space>
    </div>
  );
}
