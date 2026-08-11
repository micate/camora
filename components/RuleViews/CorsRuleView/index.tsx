import { ReactNode, useState } from 'react';
import { Space, Input, Button, Switch, Popconfirm, Tooltip } from 'antd';
import { SearchOutlined, CopyOutlined, DeleteOutlined } from '@ant-design/icons';
import { CorsRule } from '../../../types';
import { uniqueId } from '../../../utils/uniqueId';
import { determineFilterType } from '../../../utils/determineInputType';
import {
  CREDENTIAL_CORS_ALLOW_HEADERS,
  CREDENTIAL_CORS_ALLOW_METHODS,
  DEFAULT_CORS_ALLOW_HEADERS,
  DEFAULT_CORS_ALLOW_METHODS,
  DEFAULT_CORS_ALLOW_ORIGIN,
  DEFAULT_CORS_MAX_AGE,
} from '../../../utils/corsDefaults';
import './index.less';

interface IRuleViewProps {
  rule: CorsRule;
  onChange: (rule: CorsRule) => void;
  onCopyRule: (rule: CorsRule) => void;
  onDelete: () => void;
  dragHandle: ReactNode;
}

export default function CorsRuleView(props: IRuleViewProps) {
  const { rule, onChange, onCopyRule, onDelete, dragHandle } = props;
  const { source, allowOrigin, allowCredentials } = rule || {};
  const [draftSource, setDraftSource] = useState(source ?? '');
  const [draftAllowOrigin, setDraftAllowOrigin] = useState(
    allowCredentials && allowOrigin !== DEFAULT_CORS_ALLOW_ORIGIN
      ? allowOrigin ?? ''
      : DEFAULT_CORS_ALLOW_ORIGIN,
  );
  const [draftAllowCredentials, setDraftAllowCredentials] = useState(Boolean(allowCredentials));

  const handleSourceChange = () => {
    if (draftSource === source) {
      return;
    }
    const sourceType = determineFilterType(draftSource).type;
    onChange({ ...rule, source: draftSource, sourceType })
  };

  const saveOrigin = () => {
    onChange({
      ...rule,
      allowOrigin: draftAllowOrigin || undefined,
      allowCredentials: true,
      allowMethods: CREDENTIAL_CORS_ALLOW_METHODS,
      allowHeaders: CREDENTIAL_CORS_ALLOW_HEADERS,
      maxAge: DEFAULT_CORS_MAX_AGE,
    });
  };

  const handleCredentialsChange = (checked: boolean) => {
    const nextOrigin = checked
      ? (draftAllowOrigin === DEFAULT_CORS_ALLOW_ORIGIN ? '' : draftAllowOrigin)
      : DEFAULT_CORS_ALLOW_ORIGIN;

    setDraftAllowCredentials(checked);
    setDraftAllowOrigin(nextOrigin);
    onChange({
      ...rule,
      allowOrigin: nextOrigin || undefined,
      allowCredentials: checked || undefined,
      allowMethods: checked ? CREDENTIAL_CORS_ALLOW_METHODS : DEFAULT_CORS_ALLOW_METHODS,
      allowHeaders: checked ? CREDENTIAL_CORS_ALLOW_HEADERS : DEFAULT_CORS_ALLOW_HEADERS,
      maxAge: DEFAULT_CORS_MAX_AGE,
    });
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
    <div className={`rule-view cors-rule-view ${rule.enabled ? 'rule-view-enabled' : 'rule-view-disabled'}`}>
      <div className="rule-view-content cors-rule-content">
        <div className="rule-view-source cors-rule-source">
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
            placeholder={chrome.i18n.getMessage('source_map_source_placeholder')}
            value={draftSource}
            onChange={(e) => setDraftSource(e.target.value)}
            onPressEnter={handleSourceChange}
            onBlur={handleSourceChange}
          />
        </div>
        {draftAllowCredentials ? (
          <div className="cors-rule-field cors-rule-field-origin">
            <Input
              addonBefore="Allow Origin"
              size="small"
              status={!draftAllowOrigin || draftAllowOrigin === DEFAULT_CORS_ALLOW_ORIGIN ? 'error' : undefined}
              placeholder="https://app.example.com"
              value={draftAllowOrigin}
              onChange={(e) => setDraftAllowOrigin(e.target.value)}
              onPressEnter={saveOrigin}
              onBlur={saveOrigin}
            />
          </div>
        ) : null}
        <div className="cors-rule-toolbar">
          <div className="cors-rule-options">
            <div className="cors-rule-option">
              <span className="cors-rule-option-label">Credentials</span>
              <Switch
                size="small"
                checked={draftAllowCredentials}
                onChange={handleCredentialsChange}
              />
            </div>
          </div>
          <Space className="rule-view-actions cors-rule-actions" size="small" direction="horizontal">
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
            {dragHandle}
            <Switch size="small" checked={rule.enabled} onChange={handleToggleRule} />
          </Space>
        </div>
      </div>
    </div>
  );
}
