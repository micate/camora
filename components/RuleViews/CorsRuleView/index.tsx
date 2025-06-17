import { useState } from 'react';
import { Space, Input, Button, Divider, Switch, Popconfirm, Tooltip } from 'antd';
import { SearchOutlined, CopyOutlined, DeleteOutlined, ReadOutlined } from '@ant-design/icons';
import { CorsRule } from '../../../types';
import { uniqueId } from '../../../utils/uniqueId';
import { determineFilterType } from '../../../utils/determineInputType';
import './index.less';

interface IRuleViewProps {
  rule: CorsRule;
  onChange: (rule: CorsRule) => void;
  onCopyRule: (rule: CorsRule) => void;
  onDelete: () => void;
}

export default function CorsRuleView(props: IRuleViewProps) {
  const { rule, onChange, onCopyRule, onDelete } = props;
  const { source, allowOrigin, allowCredentials, allowMethods, allowHeaders, maxAge } = rule || {};
  const [draftSource, setDraftSource] = useState(source);
  const [draftAllowOrigin, setDraftAllowOrigin] = useState(allowOrigin);
  const [draftAllowCredentials, setDraftAllowCredentials] = useState(allowCredentials);
  const [draftAllowMethods, setDraftAllowMethods] = useState(allowMethods);
  const [draftAllowHeaders, setDraftAllowHeaders] = useState(allowHeaders);
  const [draftMaxAge, setDraftMaxAge] = useState(maxAge);

  const handleSourceChange = () => {
    if (draftSource === source) {
      return;
    }
    const sourceType = determineFilterType(draftSource).type;
    onChange({ ...rule, source: draftSource, sourceType })
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
            placeholder={chrome.i18n.getMessage('source_map_source_placeholder')}
            value={draftSource}
            onChange={(e) => setDraftSource(e.target.value)}
            onPressEnter={handleSourceChange}
            onBlur={handleSourceChange}
          />
        </div>
        <div className="rule-view-allow-origin">
          <Input
            addonBefore="origin"
            size="small"
            placeholder="Allow Origin, e.g. https://www.example.com"
            value={draftAllowOrigin}
            onChange={(e) => setDraftAllowOrigin(e.target.value)}
          />
        </div>
        <div className="rule-view-allow-methods">
          <Input
            addonBefore="origin"
            size="small"
            placeholder="Allow Methods, e.g. GET, POST, PUT, DELETE, PATCH or *"
            value={draftAllowMethods}
            onChange={(e) => setDraftAllowMethods(e.target.value)}
          />
        </div>
        <div className="rule-view-allow-headers">
          <Input
            addonBefore="origin"
            size="small"
            placeholder="Allow Headers, e.g. Content-Type or *"
            value={draftAllowHeaders}
            onChange={(e) => setDraftAllowHeaders(e.target.value)}
          />
        </div>
        <div className="rule-view-target">
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
