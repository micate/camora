import { useEffect, useState } from "react";
import { Divider, Form, Modal, Segmented, Switch } from "antd";
import "./index.less";

interface ISettingProps {
  visible: boolean;
  onClose: () => void;
}

export default function Setting(props: ISettingProps) {
  const { visible, onClose } = props;
  const [currentTab, setCurrentTab] = useState('common');
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      chrome.storage.local.get(
        ['enableSourceMap', 'enableBackup'],
        ({ enableSourceMap, enableBackup }) => {
          form.setFieldsValue({
            enableSourceMap: enableSourceMap || false,
            enableBackup: enableBackup || false,
          });
        }
      );
    }
  }, [visible]);

  const handleFormChange = (values: any) => {
    const { enableSourceMap, enableBackup } = values || {};
    if (enableSourceMap !== undefined) {
      chrome.storage.local.set({ enableSourceMap });
    }
    if (enableBackup !== undefined) {
      chrome.storage.local.set({ enableBackup });
      if (enableBackup) {
        chrome.runtime.sendMessage({ action: "doBackup" });
      }
    }
  };

  return (
    <Modal
      title={null}
      open={visible}
      centered
      onCancel={onClose}
      footer={null}
    >
      <div className="app-setting-header">
        <div className="app-setting-tabs">
          <Segmented
            value={currentTab}
            onChange={setCurrentTab}
            options={[
              { label: chrome.i18n.getMessage('common'), value: 'common' },
              { label: chrome.i18n.getMessage('advanced'), value: 'advanced', disabled: true },
            ]}
          />
        </div>
        <Divider style={{ margin: '8px 0 0' }} />
      </div>
      <div className="app-setting-content">
        <Form
          form={form}
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          layout="horizontal"
          onValuesChange={handleFormChange}
          size="small"
          colon={false}
          style={{ marginTop: 8 }}
        >
          <Form.Item label={chrome.i18n.getMessage('enable_source_map')} name="enableSourceMap">
            <Switch />
          </Form.Item>
          <Form.Item label={chrome.i18n.getMessage('enable_backup')} name="enableBackup">
            <Switch />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}
