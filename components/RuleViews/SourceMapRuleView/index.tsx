import { ReactNode, useState } from 'react';
import { Space, Input, Button, Switch, Popconfirm, Tooltip } from 'antd';
import { SearchOutlined, CopyOutlined, DeleteOutlined, ReadOutlined, PlusSquareOutlined } from '@ant-design/icons';
import { SourceMapRule } from '../../../types';
import { determineFilterType } from '../../../utils/determineInputType';
import './index.less';

interface IRuleViewProps {
  rule: SourceMapRule;
  onChange: (rule: SourceMapRule) => void;
  onCopyRule: (rule: SourceMapRule) => void;
  onDuplicateRule: (rule: SourceMapRule) => void;
  onDelete: () => void;
  dragHandle: ReactNode;
}

export default function SourceMapRuleView(props: IRuleViewProps) {
  const { rule, onChange, onCopyRule, onDuplicateRule, onDelete, dragHandle } = props;
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

  const getRuleSnapshot = () => {
    return {
      ...rule,
      source: draftSource,
      sourceType: determineFilterType(draftSource).type,
      sourceMapUrl: draftSourceMapUrl,
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
            placeholder={chrome.i18n.getMessage('source_map_source_placeholder')}
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
            placeholder={chrome.i18n.getMessage('source_map_url_placeholder')}
            value={draftSourceMapUrl}
            onChange={(e) => setDraftSourceMapUrl(e.target.value)}
            onPressEnter={handleSourceMapUrlChange}
            onBlur={handleSourceMapUrlChange}
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
