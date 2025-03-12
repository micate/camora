import { useState } from 'react';
import { Space, Input, Button, Divider, Switch, Popconfirm, Tooltip } from 'antd';
import { SearchOutlined, CopyOutlined, DeleteOutlined, ReadOutlined } from '@ant-design/icons';
import { SourceMapRule } from '../../../types';
import { uniqueId } from '../../../utils/uniqueId';
import { determineFilterType } from '../../../utils/determineInputType';
import './index.less';

interface IRuleViewProps {
  rule: SourceMapRule;
  onChange: (rule: SourceMapRule) => void;
  onCopyRule: (rule: SourceMapRule) => void;
  onDelete: () => void;
}

export default function SourceMapRuleView(props: IRuleViewProps) {
  const { rule, onChange, onCopyRule, onDelete } = props;
  const { source, sourceMapUrl } = rule || {};
  const [draftSource, setDraftSource] = useState(source);
  const [draftSourceMapUrl, setDraftSourceMapUrl] = useState(sourceMapUrl);

  const handleSourceChange = () => {
    if (draftSource === source) {
      return;
    }

    let autoSourceMapUrl = draftSourceMapUrl;
    if (!draftSourceMapUrl) {
      const matches = draftSource.match(/^https?:\/\/(dev\.)?g\.alicdn\.com\/([^\/]+)\/([^\/]+)\/([^\/]+)\/([^\/]+)\.js$/);
      if (matches) {
        const [, , group, repo, version, filename] = matches;
        autoSourceMapUrl = `https://sourcemap.def.alibaba-inc.com/sourcemap/${group}/${repo}/${version}/${filename}.js.map`;
        setDraftSourceMapUrl(autoSourceMapUrl);
      }
    }

    const sourceType = determineFilterType(draftSource).type;
    onChange({ ...rule, source: draftSource, sourceType, sourceMapUrl: autoSourceMapUrl })
  };

  const handleSourceMapUrlChange = () => {
    if (draftSourceMapUrl === sourceMapUrl) {
      return;
    }
    onChange({ ...rule, sourceMapUrl: draftSourceMapUrl });
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
              <ReadOutlined />
            )}
            size="small"
            value={draftSourceMapUrl}
            onChange={(e) => setDraftSourceMapUrl(e.target.value)}
            onPressEnter={handleSourceMapUrlChange}
            onBlur={handleSourceMapUrlChange}
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
