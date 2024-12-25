import React from 'react';
import { Space, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import RuleView from '../RuleView';
import { Rule, RuleGroup } from '../../types';
import './index.less';

interface IGroupViewProps {
  group: RuleGroup;
}

export default function GroupView(props: IGroupViewProps) {
  const { group } = props;
  const { name, rules } = group || {};

  return (
    <div className="group-view">
      <div className="group-view-header">
        <div className="group-view-name">{name}</div>
        <div className="group-view-actions">
          <Button size="small" icon={<PlusOutlined />} ghost type="primary" shape="circle" />
        </div>
      </div>
      <Space className="group-view-content" size="small" direction="vertical">
        {(rules || []).map((rule) => (
          <RuleView key={rule.id} rule={rule} />
        ))}
      </Space>
    </div>
  );
}