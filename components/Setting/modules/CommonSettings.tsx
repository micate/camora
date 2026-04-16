import { useState, useEffect } from "react";
import { Form, Switch } from "antd";
import { useApp } from "antd/es/app/context";

interface CommonSettingsProps {
  open: boolean;
}

export default function CommonSettings({ open }: CommonSettingsProps) {
  const [form] = Form.useForm();
  const { message } = useApp();

  useEffect(() => {
    if (open) {
      chrome.storage.local.get(
        ['enableSourceMap', 'enableCors', 'enableBackup'],
        ({ enableSourceMap, enableCors, enableBackup }) => {
          form.setFieldsValue({
            enableSourceMap: enableSourceMap || false,
            enableCors: enableCors || false,
            enableBackup: enableBackup || false,
          });
        }
      );
    }
  }, [open]);

  const handleFormChange = (values: any) => {
    const { enableSourceMap, enableCors, enableBackup } = values || {};
    
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
  };

  return (
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
  );
}
