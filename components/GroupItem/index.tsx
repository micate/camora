import { useState } from 'react';
import classnames from 'classnames';
import { Checkbox, Dropdown, Button, Modal, MenuProps } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { RuleGroup } from '../../types';
import './index.less';

interface GroupItemProps {
  id: string;
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
  const [hover, setHover] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: props.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'edit',
      label: chrome.i18n.getMessage('group_edit'),
      onClick: () => {
        onEditGroup(item);
      },
    },
    {
      key: 'copy',
      label: chrome.i18n.getMessage('group_copy'),
      onClick: () => {
        onCopyGroup(item);
      },
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      danger: true,
      label: chrome.i18n.getMessage('group_delete'),
      onClick: () => {
        Modal.confirm({
          title: chrome.i18n.getMessage('group_delete_title'),
          content: chrome.i18n.getMessage('group_delete_confirm'),
          onOk: () => {
            onDeleteGroup(item);
          },
        });
      },
    }
  ];

  return (
    <div
      ref={setNodeRef}
      className={classnames('group-item', {
        'group-item-hover': hover,
        'group-item-active': active,
      })}
      data-group-id={item.id}
      style={style}
    >
      <div className="group-name">
        <Checkbox
          checked={item.enabled}
          onChange={(e) => onToggleGroup(e.target.checked)}
        />
        <span
          className="group-name-text"
          onClick={onClick}
          {...attributes}
          {...listeners}
        >
          {item.name}
        </span>
      </div>
      <div className="group-actions">
        <Dropdown
          menu={{ items: menuItems }}
          placement="bottom"
          autoAdjustOverflow
          arrow
          onOpenChange={(open) => {
            setHover(open);
          }}
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