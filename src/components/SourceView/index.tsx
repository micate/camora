import { CSSProperties, useEffect, useRef, useState } from "react";
import { EditorView, minimalSetup } from "codemirror"
import { json } from "@codemirror/lang-json"
import { oneDark } from "@codemirror/theme-one-dark";
import { Button, message, Modal, Spin } from "antd";
import { LoadingOutlined } from '@ant-design/icons';
import { useDarkMode } from "../../hooks/useDarkMode";
import { exportRules } from "../../utils/exportRules";
import './index.less';

interface ISourceViewProps {
  style?: CSSProperties;
  visible?: boolean;
  onClose?: () => void;
}

export default function SourceView(props: ISourceViewProps) {
  const { style, visible, onClose } = props;
  const editorRef = useRef<any>(null);
  const contentRef = useRef<any>(null);
  const initialSource = useRef<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const darkMode = useDarkMode();
  const [messageApi, contextHolder] = message.useMessage();

  const updateEditorState = () => {
    setLoading(true);
    exportRules().then((rulesText: string) => {
      if (editorRef.current) {
        editorRef.current.dispatch({
          changes: {
            from: 0,
            to: editorRef.current.state.doc.length,
            insert: rulesText,
          },
        });
        initialSource.current = rulesText;
      }
      setTimeout(() => {
        setLoading(false);
      }, 300);
    });
  };

  useEffect(() => {
    if (visible) {
      if (!editorRef.current) {
        const extensions = [
          minimalSetup,
          json(),
        ];
        if (darkMode) {
          extensions.push(oneDark);
        }
        editorRef.current = new EditorView({
          extensions,
          parent: contentRef.current,
        });
      }
      updateEditorState();
      editorRef.current?.focus();
    }

    return () => {
      if (editorRef.current) {
        console.info('editor destroyed');
        editorRef.current.destroy();
        editorRef.current = null;
      }
    }
  }, [visible, darkMode, contentRef.current]);

  const handleImport = () => {
    const newSource = editorRef.current.state.doc.toString();

    try {
      const newData = JSON.parse(newSource);
      const newDataSource = JSON.stringify(newData, null, 2);
      if (newDataSource !== initialSource.current) {
        chrome.storage.local.set({ groups: newData.groups });
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
          <div ref={contentRef} className="app-source-view-content" />
          <div className="app-source-view-actions">
            <div className="app-source-view-left-actions">

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
