import { useState } from 'react';
import classnames from 'classnames';
import { App, Checkbox, Dropdown, Button } from 'antd';
import type { MenuProps } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { RuleGroup } from '../../types';
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
  const { modal } = App.useApp();

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
    // Group rows can have different heights when their names wrap. Applying
    // dnd-kit's scale values would stretch the entire active row to the height
    // of the item currently under it, so only apply the sortable translation.
    transform: CSS.Translate.toString(transform),
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
        modal.confirm({
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
          onDoubleClick={() => {
            onToggleGroup(!item.enabled);
          }}
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
