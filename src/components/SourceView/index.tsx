import { CSSProperties, forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { EditorView, minimalSetup } from "codemirror"
import { json } from "@codemirror/lang-json"
import { oneDark } from "@codemirror/theme-one-dark";
import { Button, Spin } from "antd";
import { LoadingOutlined } from '@ant-design/icons';
import { useDarkMode } from "../../hooks/useDarkMode";
import { exportRules } from "../../utils/exportRules";
import './index.less';

interface ISourceViewProps {
  style?: CSSProperties;
  onClose?: () => void;
}

export default function SourceView(props: ISourceViewProps) {
  const { style, onClose } = props;
  const editorRef = useRef<any>(null);
  const contentRef = useRef<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const darkMode = useDarkMode();

  const updateEditorState = (value: string) => {
    if (editorRef.current) {
      editorRef.current.dispatch({
        changes: {
          from: 0,
          to: editorRef.current.state.doc.length,
          insert: value,
        },
      });
    }
  };

  useEffect(() => {
    exportRules().then((rulesText: string) => {
      console.info('rulesText', rulesText);
      updateEditorState(rulesText);
      setTimeout(() => {
        setLoading(false);
      }, 300);
    })
  }, []);

  useEffect(() => {
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

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
      }
    }
  }, [darkMode, contentRef.current]);

  const handleImport = () => {
    // TODO
  }

  const handleClose = () => {
    onClose?.();
  }

  return (
    <Spin indicator={<LoadingOutlined spin />} spinning={loading}>
      <div className="app-source-view" style={style}>
        <div ref={contentRef} className="app-source-view-content" />
        <div className="app-source-view-actions">
          <Button type="primary" size="middle" onClick={handleImport}>
            导入
          </Button>
          <Button size="middle" onClick={handleClose}>
            关闭
          </Button>
        </div>
      </div>
    </Spin>
  );
}
