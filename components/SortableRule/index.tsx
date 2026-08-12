import type { ReactNode } from 'react';
import { Divider } from 'antd';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './index.less';

interface SortableRuleProps {
  id: string;
  children: (dragHandle: ReactNode) => ReactNode;
}

export default function SortableRule({ id, children }: SortableRuleProps) {
  const {
    attributes,
    listeners,
    isDragging,
    setActivatorNodeRef,
    setNodeRef,
    transform,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
  };

  const dragHandle = (
    <span
      ref={setActivatorNodeRef}
      className="rule-drag-handle"
      aria-label={chrome.i18n.getMessage('reorder_rule')}
      {...attributes}
      {...listeners}
    >
      <Divider type="vertical" />
    </span>
  );

  return (
    <div
      ref={setNodeRef}
      className={`sortable-rule ${isDragging ? 'sortable-rule-dragging' : ''}`}
      style={style}
    >
      {children(dragHandle)}
    </div>
  );
}
