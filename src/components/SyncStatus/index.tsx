import { useEffect, useState } from 'react';
import { SyncOutlined, CheckCircleTwoTone, WarningOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import { ISyncStatus } from '../../types';

export default function SyncStatus() {
  const [syncStatus, setSyncStatus] = useState<ISyncStatus | null>(null);

  useEffect(() => {
    const onStorageChange = () => {
      chrome.storage.local.get('syncStatus').then(({ syncStatus }) => {
        setSyncStatus(syncStatus);
      });
    };
    onStorageChange();

    chrome.storage.local.onChanged.addListener(onStorageChange);
    return () => {
      chrome.storage.local.onChanged.removeListener(onStorageChange);
    };
  }, []);

  const iconStyle = { fontSize: 14 };

  let statusIcon;
  let statusMessage;
  if (syncStatus?.loading) {
    statusIcon = <SyncOutlined style={iconStyle} spin />;
    statusMessage = chrome.i18n.getMessage('syncing');
  } else if (syncStatus?.success) {
    statusIcon = <CheckCircleTwoTone style={iconStyle} twoToneColor="#52c41a" />;
    statusMessage = <span>{chrome.i18n.getMessage('sync_success')}<br />{syncStatus.success}</span>;
  } else if (syncStatus?.error) {
    statusIcon = <WarningOutlined style={iconStyle} twoToneColor="#ff4d4f" />;
    statusMessage = <span>{chrome.i18n.getMessage('sync_error')}<br />{syncStatus.error}</span>;
  }

  return (
    <Tooltip title={statusMessage} placement="bottom">
      {statusIcon}
    </Tooltip>
  );
}