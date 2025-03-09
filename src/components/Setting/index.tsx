import { useEffect, useRef, useState } from "react";
import { Alert, Divider, Form, Modal, Segmented, Switch } from "antd";
import { javascript } from "@codemirror/lang-javascript";
import CodeView from "../CodeView";
import "./index.less";

interface ISettingProps {
  visible: boolean;
  onClose: () => void;
}

const DefaultSourceMapFormatter = `function sourceMapFormatter(url) {
  try {
    let urlObj = new URL(url);
    // urlObj.hostname = 'new.hostname.com';
    // urlObj.pathname = '/new/path';
    // let pathParts = urlObj.pathname.split('.');
    // if (pathParts.length > 1) {
    //   pathParts[pathParts.length - 1] = '.js.map';
    //   urlObj.pathname = pathParts.join('.');
    // }
    return urlObj.toString();
  } catch (error) {
    console.error("Invalid URL:", error);
    return null;
  }
}`;

export default function Setting(props: ISettingProps) {
  const { visible, onClose } = props;
  const [currentTab, setCurrentTab] = useState('sourceMap');
  const extensions = useRef([javascript()]);
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      chrome.storage.local.get(['enableSourceMap', 'sourceMapFormatter'], ({ enableSourceMap, sourceMapFormatter }) => {
        form.setFieldsValue({
          enableSourceMap: enableSourceMap || false,
          sourceMapFormatter: sourceMapFormatter || DefaultSourceMapFormatter,
        });
      });
    }
  }, [visible]);

  const handleFormChange = (values: any) => {
    const { enableSourceMap, sourceMapFormatter } = values || {};
    if (enableSourceMap !== undefined) {
      chrome.storage.local.set({ enableSourceMap });
    }
    if (sourceMapFormatter !== undefined) {
      chrome.storage.local.set({ sourceMapFormatter });
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
              { label: chrome.i18n.getMessage('appearance'), value: 'appearance', disabled: true },
              { label: chrome.i18n.getMessage('sourceMap'), value: 'sourceMap' },
            ]}
          />
        </div>
        <Divider style={{ margin: '8px 0 0' }} />
      </div>
      <div className="app-setting-content">
        <Alert message={chrome.i18n.getMessage('source_map_tips')} type="info" showIcon />
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
          <Form.Item label={chrome.i18n.getMessage('source_map_formatter')} name="sourceMapFormatter">
            <CodeView height={200} extensions={extensions.current} />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}
