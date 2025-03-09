import { useEffect, useRef } from "react";
import { EditorView, minimalSetup } from "codemirror"
import { oneDark } from "@codemirror/theme-one-dark";
import { useDarkMode } from "../../hooks/useDarkMode";
import './index.less';

interface ICodeViewProps {
  height?: string | number;
  value?: string;
  onChange?: (value: string) => void;
  extensions?: any[];
}

export default function CodeView(props: ICodeViewProps) {
  const { height = 100, value, onChange, extensions: extensionsProp } = props;
  const editorRef = useRef<any>(null);
  const contentRef = useRef<any>(null);
  const darkMode = useDarkMode();

  useEffect(() => {
    const cleanup = () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
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
        onChange?.(newValue);
      }
    }));
    editorRef.current = new EditorView({
      extensions,
      parent: contentRef.current,
    });
    editorRef.current?.focus();

    return () => {
      cleanup();
    }
  }, [darkMode, extensionsProp, contentRef.current]);

  useEffect(() => {
    if (editorRef.current) {
      const currentValue = editorRef.current.state.doc.toString();
      if (currentValue !== value) {
        editorRef.current.dispatch({
          changes: {
            from: 0,
            to: editorRef.current.state.doc.length,
            insert: value,
          },
        });
      }
    }
  }, [value]);

  return (
    <div className="code-view-container">
      <div ref={contentRef} className="code-view" style={{ height }}></div>
    </div>
  )
}
