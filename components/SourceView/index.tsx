import { CSSProperties, useEffect, useRef, useState } from "react";
import { json } from "@codemirror/lang-json"
import { Button, message, Modal, Spin } from "antd";
import { LoadingOutlined } from '@ant-design/icons';
import { exportRules } from "../../utils/exportRules";
import { correctIds } from "../../utils/correctIds";
import CodeView from "../CodeView";
import Backup from "../Backup";
import { RuleGroup } from "../../types";
import './index.less';

interface ISourceViewProps {
  style?: CSSProperties;
  visible?: boolean;
  onClose?: () => void;
}

export default function SourceView(props: ISourceViewProps) {
  const { style, visible, onClose } = props;
  const initialSource = useRef<string>('');
  const [ruleSource, setRuleSource] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (visible) {
      updateEditorState();
    }
  }, [visible]);

  const buildRuleSource = (groups: RuleGroup[]) => {
    return JSON.stringify({
      vendor: 'Camora',
      version: 1,
      createTime: getCurrentTime(),
      groups,
    }, null, 2);
  }

  const updateEditorState = () => {
    setLoading(true);
    exportRules().then((groups: RuleGroup[]) => {
      const rulesText = buildRuleSource(groups);
      setRuleSource(rulesText);
      initialSource.current = rulesText;
      setTimeout(() => {
        setLoading(false);
      }, 300);
    });
  };

  const handleBackupChange = (groups?: RuleGroup[]) => {
    if (groups) {
      const rulesText = buildRuleSource(groups);
      if (rulesText !== ruleSource) {
        setRuleSource(rulesText);
      }
    } else {
      setRuleSource(initialSource.current);
    }
  };

  const handleImport = () => {
    try {
      const newData = JSON.parse(ruleSource);
      const newDataSource = JSON.stringify(newData, null, 2);
      if (newDataSource !== initialSource.current) {
        const groups = correctIds(newData.groups)
        chrome.storage.local.set({ groups });
        messageApi.open({
          type: 'success',
          content: chrome.i18n.getMessage('import_success'),
          onClose: () => {
            location.reload();
          },
        });
      } else {
        messageApi.open({
          type: 'warning',
          content: chrome.i18n.getMessage('import_not_changed'),
        });
      }
    } catch (e: any) {
      Modal.error({
        title: chrome.i18n.getMessage('import_error_title'),
        content: chrome.i18n.getMessage('import_error_content_invalid', e.message),
      });
    }
  }

  const handleClose = () => {
    onClose?.();
  }

  return (
    <Modal
      closable={false}
      centered
      width={680}
      wrapClassName="app-source-view-modal"
      open={visible}
      onCancel={handleClose}
      footer={false}
    >
      <Spin indicator={<LoadingOutlined spin />} spinning={loading}>
        <div className="app-source-view" style={style}>
          {visible ? (
            <CodeView
              className="app-source-view-content"
              height="100%"
              extensions={[json()]}
              value={ruleSource}
              onChange={(value) => {
                setRuleSource(value);
              }}
            />
          ) : null}
          <div className="app-source-view-actions">
            <div className="app-source-view-left-actions">
              <Backup onChange={handleBackupChange} />
            </div>
            <div className="app-source-view-right-actions">
              <Button size="middle" onClick={handleClose}>
                {chrome.i18n.getMessage('close')}
              </Button>
              <Button type="primary" size="middle" onClick={handleImport}>
                {chrome.i18n.getMessage('import')}
              </Button>
            </div>
          </div>
        </div>
      </Spin>
      {contextHolder}
    </Modal>
  );
}
