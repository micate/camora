import React, { useEffect } from 'react';
import { Space, Input, Button, Divider, Checkbox, Switch } from 'antd';
import { SearchOutlined, CopyOutlined, DeleteOutlined, EditOutlined, CheckSquareOutlined } from '@ant-design/icons';
import { Rule } from '../../types';
import './index.less';

interface IRuleViewProps {
  rule: Rule;
}

export default function RuleView(props: IRuleViewProps) {
  const { rule } = props;
  const { source, target } = rule || {};

  return (
    <div className={`rule-view ${rule.enabled ? 'rule-view-enabled' : 'rule-view-disabled'}`}>
      <Space className="rule-view-content" size="small" direction="vertical">
        <div className="rule-view-source">
          <Input addonBefore={<SearchOutlined />} size="small" value={source} />
        </div>
        <div className="rule-view-target">
          <Input addonBefore={<EditOutlined />} size="small" value={target} />
          <Space className="rule-view-actions" size="small" direction="horizontal">
            <Button size="small" icon={<CopyOutlined />} />
            <Button size="small" icon={<DeleteOutlined />} />
            <Divider type="vertical" />
            {/* <Button size="small" icon={<CheckSquareOutlined />} style={{ backgroundColor: rule.enabled ? 'green' : 'gray' }} /> */}
            {/* <Checkbox checked={rule.enabled} /> */}
            <Switch checked={rule.enabled} />
          </Space>
        </div>
      </Space>
    </div>
  );
}