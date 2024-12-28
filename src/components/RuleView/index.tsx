import { useState } from 'react';
import { Space, Input, Button, Divider, Switch, Popconfirm } from 'antd';
import { SearchOutlined, CopyOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Rule } from '../../types';
import { uniqueId } from '../../utils/uniqueId';
import './index.less';

interface IRuleViewProps {
  rule: Rule;
  onChange: (rule: Rule) => void;
  onDelete: () => void;
}

export default function RuleView(props: IRuleViewProps) {
  const { rule, onChange, onDelete } = props;
  const { source, target } = rule || {};
  const [draftSource, setDraftSource] = useState(source);
  const [draftTarget, setDraftTarget] = useState(target);

  const handleSourceChange = () => {
    onChange({ ...rule, source: draftSource })
  };

  const handleTargetChange = () => {
    onChange({ ...rule, target: draftTarget })
  };

  const handleCopyRule = () => {
    const newRule = { ...rule };
    newRule.id = uniqueId('rule');
    onChange(newRule);
  };

  const handleToggleRule = (checked: boolean) => {
    onChange({ ...rule, enabled: checked });
  };

  return (
    <div className={`rule-view ${rule.enabled ? 'rule-view-enabled' : 'rule-view-disabled'}`}>
      <Space className="rule-view-content" size="small" direction="vertical">
        <div className="rule-view-source">
          <Input
            addonBefore={<SearchOutlined />}
            size="small"
            value={draftSource}
            onChange={(e) => setDraftSource(e.target.value)}
            onPressEnter={handleSourceChange}
            onBlur={handleSourceChange}
          />
        </div>
        <div className="rule-view-target">
          <Input
            addonBefore={<EditOutlined />}
            size="small"
            value={draftTarget}
            onChange={(e) => setDraftTarget(e.target.value)}
            onPressEnter={handleTargetChange}
            onBlur={handleTargetChange}
          />
          <Space className="rule-view-actions" size="small" direction="horizontal">
            <Button size="small" icon={<CopyOutlined />} onClick={handleCopyRule} />
            <Popconfirm
              title="Delete this rule?"
              description="This action cannot be undone."
              onConfirm={onDelete}
              placement="bottomRight"
            >
              <Button size="small" icon={<DeleteOutlined />} />
            </Popconfirm>
            <Divider type="vertical" />
            <Switch checked={rule.enabled} onChange={handleToggleRule} />
          </Space>
        </div>
      </Space>
    </div>
  );
}