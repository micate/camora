import { Checkbox, Dropdown, Button } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { RuleGroup } from '../../types';
import './index.less';

interface GroupItemProps {
  item: RuleGroup;
  handleToggleGroup: (groupId: string, enabled: boolean) => void;
  active?: boolean;
  onClick?: () => void;
}

export default function GroupItem(props: GroupItemProps) {
  const { item, handleToggleGroup, active, onClick } = props;
  const menuItems = [
    {
      key: 'edit',
      label: '重命名',
    },
    {
      key: 'copy',
      label: '复制',
    },
    {
      key: 'delete',
      label: '删除',
    }
  ];

  return (
    <div className={`group-item ${active ? 'group-item-active' : 'group-item-inactive'}`}>
      <div className="group-name" onClick={onClick}>
        <Checkbox
          checked={item.enabled}
          onChange={(e) => handleToggleGroup(item.id, e.target.checked)}
        >
          {item.name}
        </Checkbox>
      </div>
      <div className="group-actions">
        <Dropdown menu={{ items: menuItems }} placement="bottom" autoAdjustOverflow arrow>
          <Button
            size="small"
            type="text"
            shape="circle"
            icon={<SettingOutlined />}
          />
        </Dropdown>
      </div>
    </div>
  );
}