import { SettingOutlined } from '@ant-design/icons';
import { Button, Dropdown } from 'antd';
import './index.less';

export default function Footer() {
  const menuItems = [
    {
      key: 'help',
      label: '帮助',
    },
    {
      key: 'settings',
      label: '设置',
    },
  ];

  return (
    <div className="app-footer">
      <span className="app-footer-text">1.0.1</span>
      <span className="app-footer-actions">
        <Dropdown menu={{ items: menuItems }} placement="bottom" autoAdjustOverflow arrow>
          <Button
            size="small"
            type="text"
            shape="circle"
            icon={<SettingOutlined />}
          />
        </Dropdown>
      </span>
    </div>
  );
}