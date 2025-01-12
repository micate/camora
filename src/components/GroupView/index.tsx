import { Space, Button, Empty, Divider } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import RuleView from '../RuleView';
import { Rule, RuleGroup } from '../../types';
import { createRule } from '../../utils/createRule';
import './index.less';

interface IGroupViewProps {
  group: RuleGroup;
  onChange: (group: RuleGroup) => void;
}

export default function GroupView(props: IGroupViewProps) {
  const { group, onChange } = props;
  const { rules } = group || {};

  const handleAddRule = () => {
    const newRule = createRule();
    onChange({ ...group, rules: [...rules, newRule] });
  };

  const handleRuleChange = (rule: Rule) => {
    onChange({
      ...group,
      rules: rules.map((r) => (r.id === rule.id ? rule : r)),
    });
  };

  const handleCopyRule = (rule: Rule) => {
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

  return (
    <div className="group-view">
      {/* <div className="group-view-header">
        <div className="group-view-name">{name}</div>
      </div> */}
      {rules?.length ? (
        <Space
          className="group-view-content"
          size="small"
          direction="vertical"
          split={<Divider type="horizontal" style={{ margin: '4px 0' }} />}
        >
          {(rules || []).map((rule) => (
            <RuleView
              key={rule.id}
              rule={rule}
              onChange={handleRuleChange}
              onCopyRule={handleCopyRule}
              onDelete={() => handleDeleteRule(rule.id)}
            />
          ))}
          <div className="group-view-actions">
            <Button size="small" onClick={handleAddRule}>
              <PlusOutlined />
            </Button>
          </div>
        </Space>
      ) : (
        <Space className="group-view-content group-view-empty" size="small" direction="vertical">
          <Empty description={false}>
            <Button size="small" onClick={handleAddRule}>
              <PlusOutlined />
            </Button>
          </Empty>
        </Space>
      )}
    </div>
  );
}