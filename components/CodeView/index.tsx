import { useCallback, useEffect, useRef } from "react";
import classnames from 'classnames';
import { EditorView, minimalSetup } from "codemirror"
import { oneDark } from "@codemirror/theme-one-dark";
import { useDarkMode } from "../../hooks/useDarkMode";
import './index.less';

interface ICodeViewProps {
  className?: string;
  height?: string | number;
  value?: string;
  onChange?: (value: string) => void;
  extensions?: any[];
}

export default function CodeView(props: ICodeViewProps) {
  const { className, height = 100, value, onChange, extensions: extensionsProp } = props;
  const editorRef = useRef<any>(null);
  const contentRef = useRef<any>(null);
  const darkMode = useDarkMode();

  const updateValue = useCallback((newValue?: string) => {
    if (editorRef.current) {
      const currentValue = editorRef.current.state.doc.toString();
      if (currentValue !== newValue) {
        editorRef.current.dispatch({
          changes: {
            from: 0,
            to: editorRef.current.state.doc.length,
            insert: newValue,
          },
        });
      }
    }
  }, [editorRef.current, value]);

  useEffect(() => {
    const cleanup = () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    }

    if (!contentRef.current) {
      return;
    }

    if (editorRef.current) {
      cleanup();
    }

    const extensions = [
      minimalSetup,
      ...(extensionsProp || []),
    ];
    if (darkMode) {
      extensions.push(oneDark);
    }
    extensions.push(EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        let newValue = update.state.doc.toString();
        if (newValue !== value) {
          onChange?.(newValue);
        }
      }
    }));
    editorRef.current = new EditorView({
      extensions,
      parent: contentRef.current,
    });
    updateValue(value);
    editorRef.current?.focus();

    return () => {
      cleanup();
    }
  }, [darkMode]); // 这里不监听 extensionProp，因为 extensionProp 引用对象每次都会发生变化

  useEffect(() => {
    updateValue(value);
  }, [value]);

  return (
    <div className={classnames('code-view-container', className)}>
      <div ref={contentRef} className="code-view" style={{ height }}></div>
    </div>
  )
}
