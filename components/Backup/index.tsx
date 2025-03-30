import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Button, Popconfirm, Select, Space, Tooltip, message } from "antd";
import { CloudUploadOutlined, DeleteOutlined } from "@ant-design/icons";
import { getBackupList, createBackup, deleteBackup, getBackupData, getBytesInUse, STORAGE_LIMIT } from "../../utils/cloud";
import { exportRules } from "../../utils/exportRules";
import { RuleGroup } from "../../types";
import './index.less';

interface IBackupProps {
  onChange: (groups?: RuleGroup[]) => void;
}

export interface BackupRef {
  clear: () => void;
}

function Backup(props: IBackupProps, ref: React.ForwardedRef<BackupRef>) {
  const { onChange } = props;
  const [bytesInUse, setBytesInUse] = useState<number>(0);
  const [backupLoading, setBackupLoading] = useState<boolean>(false);
  const [backupList, setBackupList] = useState<any[]>([]);
  const [backupKey, setBackupKey] = useState<string | null>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const [isBackupEnabled, setIsBackupEnabled] = useState<boolean>(false);

  useImperativeHandle(ref, () => ({
    clear: () => {
      setBackupKey(null);
    },
  }));

  useEffect(() => {
    chrome.storage.local.get('enableBackup', ({ enableBackup }) => {
      setIsBackupEnabled(!!enableBackup);
    });

    const tryFetchEnable = (changes: any, area: string) => {
      if (area === 'local' && changes.enableBackup) {
        setIsBackupEnabled(!!changes.enableBackup.newValue);
      }
    };
    chrome.storage.onChanged.addListener(tryFetchEnable);
    return () => {
      chrome.storage.onChanged.removeListener(tryFetchEnable);
    };
  }, []);

  useEffect(() => {
    const updateUsage = async () => {
      const bytes = await getBytesInUse();
      setBytesInUse(bytes);
    };

    const tryFetchUsage = (changes: any, area: string) => {
      if (area === 'sync' && changes.backupItems) {
        updateUsage();
      }
    };
    
    chrome.storage.onChanged.addListener(tryFetchUsage);
    return () => {
      chrome.storage.onChanged.removeListener(tryFetchUsage);
    };
  }, [isBackupEnabled]);

  useEffect(() => {
    const fetchBackupList = () => {
      setBackupLoading(true);
      getBackupList()
        .then((list) => {
          const newBackupList = (list || []).map((item: any) => ({
            label: `${item.key.replace('backup_', '')} (${item.count})`,
            value: item.key,
          }));
          setBackupList(newBackupList);

          // 新列表中如果没有当前备份，则清空 key
          if (!newBackupList.find((item: any) => item.value === backupKey)) {
            setBackupKey(null);
          }
        })
        .catch((error) => {
          console.error(error);
          messageApi.error(chrome.i18n.getMessage('fetch_backup_list_failed', error.message));
        })
        .finally(() => {
          setTimeout(() => {
            setBackupLoading(false);
          }, 1000);
        });
    };

    fetchBackupList();

    const tryFetchBackupList = (changes: any, area: string) => {
      if (area === 'sync' && changes.backupItems) {
        fetchBackupList();
      }
    };
    chrome.storage.onChanged.addListener(tryFetchBackupList);
    return () => {
      chrome.storage.onChanged.removeListener(tryFetchBackupList);
    };
  }, []);

  useEffect(() => {
    if (backupKey) {
      getBackupData(backupKey)
        .then((data) => {
          onChange(data);
        })
        .catch((error) => {
          console.error(error);
          messageApi.error(chrome.i18n.getMessage('fetch_backup_failed', error.message));
        });
    } else {
      onChange();
    }
  }, [backupKey]);

  const handleCreateBackup = () => {
    exportRules().then((groups: RuleGroup[]) => {
      createBackup(groups).then((ret) => {
        if (ret === true) {
          messageApi.success(chrome.i18n.getMessage('backup_success'));
        } else if (ret === 'same') {
          messageApi.warning(chrome.i18n.getMessage('backup_same_ignore'));
        } else if (ret && ret.includes('QUOTA_BYTES_PER_ITEM')) {
          messageApi.error(chrome.i18n.getMessage('backup_item_quota_error'));
        } else {
          messageApi.error(ret);
        }
      });
    });
  };

  const handleBackupChange = (value: string) => {
    setBackupKey(value);
  };

  const handleDeleteBackup = () => {
    if (backupKey) {
      deleteBackup(backupKey)
        .then(() => {
          setBackupKey(null);
        })
        .catch((error) => {
          console.error(error);
          messageApi.error(chrome.i18n.getMessage('delete_backup_failed', error.message));
        });
    }
  };

  return (
    <div className="app-backup">
      {contextHolder}
      <Space size="small" direction="horizontal">
        <Tooltip
          title={isBackupEnabled ?(
            <dl className="app-backup-tips">
              <dt>{chrome.i18n.getMessage('backup_tips_auto_title')}</dt>
              <dd>{chrome.i18n.getMessage('backup_tips_auto_description')}</dd>
              <dt>{chrome.i18n.getMessage('backup_tips_manual_title')}</dt>
              <dd>{chrome.i18n.getMessage('backup_tips_manual_description')}</dd>
              <dt>{chrome.i18n.getMessage('backup_tips_note_title')}</dt>
              <dd>{chrome.i18n.getMessage('backup_tips_note_description_1')}</dd>
              <dd>{chrome.i18n.getMessage('backup_tips_note_description_2')}</dd>
            </dl>
          ) : chrome.i18n.getMessage('backup_no_enabled')}
          placement="topLeft"
        >
          <Button
            size="middle"
            icon={<CloudUploadOutlined />}
            onClick={handleCreateBackup}
            disabled={!isBackupEnabled}
          />
        </Tooltip>
        <Select
          size="middle"
          placeholder={chrome.i18n.getMessage('choose_backup')}
          style={{ width: 220 }}
          loading={backupLoading}
          options={backupList}
          popupMatchSelectWidth={false}
          showSearch
          value={backupKey}
          onChange={handleBackupChange}
          notFoundContent={chrome.i18n.getMessage('no_results')}
          allowClear
        />
        {backupKey && (
          <Popconfirm
            title={chrome.i18n.getMessage('delete_backup_confirm_title')}
            description={chrome.i18n.getMessage('delete_backup_confirm_description')}
            onConfirm={handleDeleteBackup}
            placement="top"
          >
            <Button size="middle" icon={<DeleteOutlined />} />
          </Popconfirm>
        )}
      </Space>
    </div>
  );
}

export default forwardRef(Backup);