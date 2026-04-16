import { useEffect, useState } from "react";
import { App, Button, Form, Input, Modal, Radio, Space, Switch } from "antd";
import { CheckOutlined, SyncOutlined } from "@ant-design/icons";
import "./index.less";

interface ISettingProps {
  open: boolean;
  onClose: () => void;
}

type SyncMode = 'overwrite' | 'merge_remote' | 'merge_local';

export default function Setting(props: ISettingProps) {
  const { open, onClose } = props;
  const [currentTab, setCurrentTab] = useState('common');
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [syncUrl, setSyncUrl] = useState<string>('');
  const [urlError, setUrlError] = useState<string>('');
  const [validating, setValidating] = useState<boolean>(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (open) {
      chrome.storage.local.get(
        ['enableSourceMap', 'enableCors', 'enableBackup', 'syncUrl', 'syncEnabled', 'syncMode'],
        ({ enableSourceMap, enableCors, enableBackup, syncUrl: storedSyncUrl, syncEnabled, syncMode }) => {
          form.setFieldsValue({
            enableSourceMap: enableSourceMap || false,
            enableCors: enableCors || false,
            enableBackup: enableBackup || false,
            syncEnabled: syncEnabled || false,
            syncMode: syncMode || 'merge_remote',
          });
          setSyncUrl(storedSyncUrl || '');
        }
      );
    }
  }, [open]);

  const handleFormChange = (values: any) => {
    const { enableSourceMap, enableCors, enableBackup, syncEnabled, syncMode } = values || {};
    if (enableSourceMap !== undefined) {
      chrome.storage.local.set({ enableSourceMap });
    }
    if (enableCors !== undefined) {
      chrome.storage.local.set({ enableCors });
    }
    if (enableBackup !== undefined) {
      chrome.storage.local.set({ enableBackup });
      if (enableBackup) {
        chrome.runtime.sendMessage({ action: "doBackup" });
      }
    }
    if (syncEnabled !== undefined) {
      chrome.storage.local.set({ syncEnabled });
      if (syncEnabled) {
        chrome.runtime.sendMessage({ action: "startSyncCheck" });
      } else {
        chrome.runtime.sendMessage({ action: "stopSyncCheck" });
      }
    }
    if (syncMode !== undefined) {
      chrome.storage.local.set({ syncMode });
    }
  };

  const validateUrlFormat = async () => {
    if (!syncUrl) {
      setUrlError('URL 不能为空');
      setIsValid(false);
      return;
    }

    setValidating(true);
    setUrlError('');
    setIsValid(null);

    try {
      // 检查 URL 格式
      new URL(syncUrl);
      
      // 尝试获取并验证 Camora 格式
      const response = await fetch(syncUrl, {
        method: 'GET',
        mode: 'cors',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      // 验证 Camora 格式
      if (!data.vendor || data.vendor !== 'Camora') {
        throw new Error('缺少 vendor 字段或 vendor 不为 Camora');
      }
      if (!data.version) {
        throw new Error('缺少 version 字段');
      }
      if (!Array.isArray(data.groups)) {
        throw new Error('缺少 groups 数组');
      }
      
      setIsValid(true);
      message.success('URL 格式校验通过！');
      
      // 保存 URL
      chrome.storage.local.set({ syncUrl });
    } catch (error: any) {
      setIsValid(false);
      setUrlError(`校验失败：${error.message}`);
      message.error(`校验失败：${error.message}`);
    } finally {
      setValidating(false);
    }
  };

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
              <Form
                form={form}
                labelCol={{ span: 8 }}
                wrapperCol={{ span: 16 }}
                layout="horizontal"
                onValuesChange={handleFormChange}
                size="small"
                colon={false}
              >
                <Form.Item label={chrome.i18n.getMessage('enable_source_map')} name="enableSourceMap">
                  <Switch />
                </Form.Item>
                <Form.Item label="Enable CORS" name="enableCors">
                  <Switch />
                </Form.Item>
                <Form.Item label={chrome.i18n.getMessage('enable_backup')} name="enableBackup">
                  <Switch />
                </Form.Item>
              </Form>
            )}
            
            {currentTab === 'sync' && (
              <div className="app-sync-settings">
                <Form
                  form={form}
                  layout="vertical"
                  size="middle"
                  colon={false}
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
                      icon={<SyncOutlined />}
                      onClick={() => {
                        chrome.runtime.sendMessage({ action: "manualSync" }, (response) => {
                          if (response?.success) {
                            message.success(response.message);
                          } else {
                            message.error(response?.message || '同步失败');
                          }
                        });
                      }}
                    >
                      {chrome.i18n.getMessage('sync_now') || '立即同步'}
                    </Button>
                  </Form.Item>
                </Form>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
