import { useEffect, useState } from 'react';
import { Space, Empty, Dropdown, MenuProps, Button } from 'antd';
import { PlusOutlined, DownOutlined } from '@ant-design/icons';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import RedirectRuleView from '../RuleViews/RedirectRuleView';
import SourceMapRuleView from '../RuleViews/SourceMapRuleView';
import CorsRuleView from '../RuleViews/CorsRuleView';
import SortableRule from '../SortableRule';
import { CorsRule, RedirectRule, Rule, RuleGroup, RuleType, SourceMapRule } from '../../types';
import { createRule } from '../../utils/createRule';
import './index.less';

interface IGroupViewProps {
  group: RuleGroup;
  onChange: (group: RuleGroup) => void;
}

export default function GroupView(props: IGroupViewProps) {
  const { group, onChange } = props;
  const { rules } = group || {};
  const [showSourceMap, setShowSourceMap] = useState(false);
  const [showCors, setShowCors] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    chrome.storage.local.get(['enableSourceMap', 'enableCors'], ({ enableSourceMap, enableCors }) => {
      setShowSourceMap(enableSourceMap)
      setShowCors(enableCors)
    });

    const onChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.enableSourceMap) {
        setShowSourceMap(!!changes.enableSourceMap.newValue);
      }
      if (changes.enableCors) {
        setShowCors(!!changes.enableCors.newValue);
      }
    };

    chrome.storage.onChanged.addListener(onChange);
    return () => {
      chrome.storage.onChanged.removeListener(onChange);
    }
  }, []);

  const menuItems: MenuProps['items'] = [
    showSourceMap ? {
      key: 'addSourceMap',
      label: chrome.i18n.getMessage('add_source_map'),
      onClick: () => {
        handleAddRule({
          type: RuleType.SourceMap,
        });
      },
    } : null,
    showCors ? {
      key: 'addCors',
      label: 'CORS',
      onClick: () => {
        handleAddRule({
          type: RuleType.CORS,
        });
      },
    } : null
  ].filter(Boolean);

  const handleAddRule = (data?: Partial<Rule>) => {
    const newRule = createRule(data);
    onChange({ ...group, rules: [...rules, newRule] });
  };

  const handleRuleChange = (rule: Rule) => {
    rule.type = rule.type || RuleType.Redirect;
    onChange({
      ...group,
      rules: rules.map((r) => (r.id === rule.id ? rule : r)),
    });
  };

  const handleCopyRule = (rule: Rule) => {
    rule.type = rule.type || RuleType.Redirect;
    onChange({
      ...group,
      rules: [...rules, rule],
    });
  };

  const handleDeleteRule = (ruleId: string) => {
    onChange({
      ...group,
      rules: rules.filter((r) => r.id !== ruleId),
    });
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;

    const oldIndex = rules.findIndex((rule) => rule.id === active.id);
    const newIndex = rules.findIndex((rule) => rule.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    onChange({
      ...group,
      rules: arrayMove(rules, oldIndex, newIndex),
    });
  };

  const addBtn = menuItems.length ? (
    <Space.Compact size="small">
      <Button
        size="small"
        onClick={() => {
          handleAddRule({ type: RuleType.Redirect });
        }}
      >
        <PlusOutlined />
      </Button>
      <Dropdown
        menu={{ items: menuItems }}
        placement="bottom"
        autoAdjustOverflow
      >
        <Button size="small" icon={<DownOutlined />} />
      </Dropdown>
    </Space.Compact>
  ) : (
    <Button size="small" onClick={() => handleAddRule({ type: RuleType.Redirect })}>
      <PlusOutlined />
    </Button>
  );

  return (
    <div className="group-view">
      {rules?.length ? (
        <div className="group-view-content group-view-rules">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={rules.map((rule) => rule.id)}
              strategy={verticalListSortingStrategy}
            >
              {(rules || []).map((rule) => (
                <SortableRule key={rule.id} id={rule.id}>
                  {(dragHandle) => {
                    if (rule.type === RuleType.SourceMap) {
                      return (
                        <SourceMapRuleView
                          rule={rule as SourceMapRule}
                          dragHandle={dragHandle}
                          onChange={handleRuleChange}
                          onCopyRule={handleCopyRule}
                          onDelete={() => handleDeleteRule(rule.id)}
                        />
                      );
                    }
                    if (rule.type === RuleType.CORS) {
                      return (
                        <CorsRuleView
                          rule={rule as CorsRule}
                          dragHandle={dragHandle}
                          onChange={handleRuleChange}
                          onCopyRule={handleCopyRule}
                          onDelete={() => handleDeleteRule(rule.id)}
                        />
                      );
                    }
                    return (
                      <RedirectRuleView
                        rule={rule as RedirectRule}
                        dragHandle={dragHandle}
                        onChange={handleRuleChange}
                        onCopyRule={handleCopyRule}
                        onDelete={() => handleDeleteRule(rule.id)}
                      />
                    );
                  }}
                </SortableRule>
              ))}
            </SortableContext>
          </DndContext>
          <div className="group-view-actions">
            {addBtn}
          </div>
        </div>
      ) : (
        <Space className="group-view-content group-view-empty" size="small" direction="vertical">
          <Empty description={false}>
            {addBtn}
          </Empty>
        </Space>
      )}
    </div>
  );
}
