import { useState } from "react";
import { Modal } from "antd";
import CommonSettings from "./modules/CommonSettings";
import SyncSettings from "./modules/SyncSettings";
import "./index.less";

interface ISettingProps {
  open: boolean;
  onClose: () => void;
}

export default function Setting(props: ISettingProps) {
  const { open, onClose } = props;
  const [currentTab, setCurrentTab] = useState('common');

  const menuItems = [
    { key: 'common', label: chrome.i18n.getMessage('common') },
    { key: 'sync', label: chrome.i18n.getMessage('sync') || '同步配置' },
  ];

  return (
    <Modal
      title={null}
      open={open}
      centered
      onCancel={onClose}
      footer={null}
      className="app-setting-modal"
    >
      <div className="app-setting-container">
        <div className="app-setting-sidebar">
          <div className="app-setting-menu">
            {menuItems.map((item) => (
              <div
                key={item.key}
                className={`app-setting-menu-item ${currentTab === item.key ? 'active' : ''}`}
                onClick={() => setCurrentTab(item.key)}
              >
                {item.label}
              </div>
            ))}
          </div>
        </div>
        <div className="app-setting-content-wrapper">
          <div className="app-setting-content-header">
            <h3>{menuItems.find(item => item.key === currentTab)?.label}</h3>
          </div>
          <div className="app-setting-content-body">
            {currentTab === 'common' && (
              <CommonSettings open={open} />
            )}
            
            {currentTab === 'sync' && (
              <SyncSettings open={open} />
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
