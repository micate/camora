import { useState, useEffect } from "react";
import { App, Button, Form, Input, Radio, Space, Switch } from "antd";
import { CheckOutlined, SyncOutlined } from "@ant-design/icons";

interface SyncSettingsProps {
  open: boolean;
}

type SyncMode = 'overwrite' | 'merge_remote' | 'merge_local';

export default function SyncSettings({ open }: SyncSettingsProps) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [syncUrl, setSyncUrl] = useState<string>('');
  const [urlError, setUrlError] = useState<string>('');
  const [validating, setValidating] = useState<boolean>(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [syncing, setSyncing] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      chrome.storage.local.get(
        ['syncUrl', 'syncEnabled', 'syncMode'],
        ({ syncUrl: storedSyncUrl, syncEnabled, syncMode }) => {
          form.setFieldsValue({
            syncEnabled: syncEnabled || false,
            syncMode: syncMode || 'merge_remote',
          });
          setSyncUrl(storedSyncUrl || '');
        }
      );
    }
  }, [open]);

  const handleFormChange = (values: any) => {
    const { syncEnabled, syncMode } = values || {};
    
    if (syncEnabled !== undefined) {
      chrome.storage.local.set({ syncEnabled });
    }
    if (syncMode !== undefined) {
      chrome.storage.local.set({ syncMode });
    }
  };

  const validateUrlFormat = async () => {
    if (!syncUrl) {
      setUrlError(chrome.i18n.getMessage('sync_url_empty') || 'URL 不能为空');
      setIsValid(false);
      return;
    }

    setValidating(true);
    setUrlError('');
    setIsValid(null);

    try {
      // Check URL format
      new URL(syncUrl);
      
      // Try to fetch and validate Camora format
      const response = await fetch(syncUrl, {
        method: 'GET',
        mode: 'cors',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      // Validate Camora format
      if (!data.vendor || data.vendor !== 'Camora') {
        throw new Error(chrome.i18n.getMessage('sync_validate_vendor_error') || '缺少 vendor 字段或 vendor 不为 Camora');
      }
      if (!data.version) {
        throw new Error(chrome.i18n.getMessage('sync_validate_version_error') || '缺少 version 字段');
      }
      if (!Array.isArray(data.groups)) {
        throw new Error(chrome.i18n.getMessage('sync_validate_groups_error') || '缺少 groups 数组');
      }
      
      setIsValid(true);
      message.success(chrome.i18n.getMessage('sync_validate_success') || 'URL 格式校验通过！');
      
      // Save URL
      chrome.storage.local.set({ syncUrl });
    } catch (error: any) {
      setIsValid(false);
      setUrlError((chrome.i18n.getMessage('sync_validate_failed') || '校验失败：') + error.message);
      message.error((chrome.i18n.getMessage('sync_validate_failed') || '校验失败：') + error.message);
    } finally {
      setValidating(false);
    }
  };

  const handleManualSync = () => {
    setSyncing(true);
    chrome.runtime.sendMessage({ action: "manualSync" }, (response) => {
      setSyncing(false);
      if (response?.success) {
        message.success(response.message);
      } else {
        message.error(response?.message || (chrome.i18n.getMessage('sync_failed') || '同步失败'));
      }
    });
  };

  return (
    <div className="app-sync-settings">
      <Form
        form={form}
        layout="vertical"
        size="middle"
        colon={false}
        onValuesChange={handleFormChange}
      >
        <Form.Item label={chrome.i18n.getMessage('sync_enabled') || '启用同步'} name="syncEnabled">
          <Switch />
        </Form.Item>
        
        <Form.Item 
          label={chrome.i18n.getMessage('sync_url') || '远程 URL'}
          help={chrome.i18n.getMessage('sync_url_help') || '请遵循 Camora 导入导出格式：{ vendor: "Camora", version: 1, groups: [...] }'}
        >
          <Space.Compact style={{ width: '100%' }}>
            <Input
              value={syncUrl}
              onChange={(e) => {
                setSyncUrl(e.target.value);
                setUrlError('');
                setIsValid(null);
              }}
              placeholder="https://example.com/sync.json"
              status={urlError ? 'error' : undefined}
            />
            <Button
              icon={validating ? <SyncOutlined spin /> : <CheckOutlined />}
              onClick={validateUrlFormat}
              loading={validating}
            >
              {chrome.i18n.getMessage('validate') || '校验'}
            </Button>
          </Space.Compact>
          {urlError && <div className="app-setting-error">{urlError}</div>}
        </Form.Item>
        
        <Form.Item 
          label={chrome.i18n.getMessage('sync_mode') || '同步模式'} 
          name="syncMode"
        >
          <Radio.Group>
            <Radio value="overwrite">{chrome.i18n.getMessage('sync_mode_overwrite') || '覆盖本地'}</Radio>
            <Radio value="merge_remote">{chrome.i18n.getMessage('sync_mode_merge_remote') || '合并到本地（以远程为准）'}</Radio>
            <Radio value="merge_local">{chrome.i18n.getMessage('sync_mode_merge_local') || '合并到本地（以本地为准）'}</Radio>
          </Radio.Group>
        </Form.Item>
        
        <Form.Item>
          <Button 
            type="primary" 
            icon={<SyncOutlined spin={syncing} />}
            onClick={handleManualSync}
            loading={syncing}
          >
            {chrome.i18n.getMessage('sync_now') || '立即同步'}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
