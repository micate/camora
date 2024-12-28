import { Checkbox, Dropdown, Button } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import { RuleGroup } from '../../types';
import './index.less';

interface GroupItemProps {
  item: RuleGroup;
  onToggleGroup: (enabled: boolean) => void;
  onEditGroup: (group: RuleGroup) => void;
  onDeleteGroup: (group: RuleGroup) => void;
  onCopyGroup: (group: RuleGroup) => void;
  active?: boolean;
  onClick?: () => void;
}

export default function GroupItem(props: GroupItemProps) {
  const { item, onToggleGroup, onEditGroup, onDeleteGroup, onCopyGroup, active, onClick } = props;
  const menuItems = [
    {
      key: 'edit',
      label: chrome.i18n.getMessage('group_edit'),
    },
    {
      key: 'copy',
      label: chrome.i18n.getMessage('group_copy'),
    },
    {
      key: 'delete',
      label: chrome.i18n.getMessage('group_delete'),
    }
  ];

  return (
    <div className={`group-item ${active ? 'group-item-active' : 'group-item-inactive'}`}>
      <div className="group-name">
        <Checkbox
          checked={item.enabled}
          onChange={(e) => onToggleGroup(e.target.checked)}
        />
        <span className="group-name-text" onClick={onClick}>
          {item.name}
        </span>
      </div>
      <div className="group-actions">
        <Dropdown
          menu={{ items: menuItems }}
          placement="bottom"
          autoAdjustOverflow
          arrow
        >
          <Button
            size="small"
            type="text"
            shape="circle"
            icon={<MenuOutlined />}
          />
        </Dropdown>
      </div>
    </div>
  );
}