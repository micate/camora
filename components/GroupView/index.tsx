import { useEffect, useState } from 'react';
import { App, Space, Empty, Dropdown, MenuProps, Button, Tooltip } from 'antd';
import { PlusOutlined, DownOutlined, SnippetsOutlined } from '@ant-design/icons';
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
import {
  copyRulesToClipboard,
  getInternalClipboardRules,
  parseRulesFromClipboard,
  saveInternalRuleClipboard,
} from '../../utils/ruleClipboard';
import './index.less';

interface IGroupViewProps {
  group: RuleGroup;
  onChange: (group: RuleGroup) => void;
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable
    || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
    || Boolean(target.closest('[contenteditable="true"]'));
}

export default function GroupView(props: IGroupViewProps) {
  const { group, onChange } = props;
  const { rules } = group || {};
  const [showSourceMap, setShowSourceMap] = useState(false);
  const [showCors, setShowCors] = useState(false);
  const { message } = App.useApp();
  const pasteShortcut = navigator.userAgent.includes('Mac OS X') ? 'Cmd + V' : 'Ctrl + V';
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

  const handleCopyRule = async (rule: Rule) => {
    try {
      const result = await copyRulesToClipboard([{
        ...rule,
        type: rule.type || RuleType.Redirect,
      }]);
      if (result.system) {
        message.success(chrome.i18n.getMessage('copy_rule_success'));
      } else {
        message.warning(chrome.i18n.getMessage('copy_rule_internal_success'));
      }
    } catch {
      message.error(chrome.i18n.getMessage('copy_rule_failed'));
    }
  };

  const handleDuplicateRule = (rule: Rule) => {
    const newRule = createRule({ type: rule.type || RuleType.Redirect });
    onChange({ ...group, rules: [...rules, { ...rule, id: newRule.id }] });
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

  const appendPastedRules = (pastedRules: Rule[]) => {
    if (!pastedRules.length) return;
    onChange({ ...group, rules: [...rules, ...pastedRules] });
    message.success(chrome.i18n.getMessage('paste_rule_success', String(pastedRules.length)));
  };

  const handlePasteRule = async () => {
    try {
      const pastedRules = await getInternalClipboardRules();
      if (!pastedRules.length) {
        message.warning(chrome.i18n.getMessage('paste_rule_empty', pasteShortcut));
        return;
      }
      appendPastedRules(pastedRules);
    } catch {
      message.error(chrome.i18n.getMessage('paste_rule_invalid'));
    }
  };

  useEffect(() => {
    const handleSystemPaste = (event: ClipboardEvent) => {
      if (isEditableTarget(event.target)) return;

      const text = event.clipboardData?.getData('text/plain') || '';
      const pastedRules = parseRulesFromClipboard(text);
      if (!pastedRules.length) return;

      event.preventDefault();
      void saveInternalRuleClipboard(text).catch(() => undefined);
      appendPastedRules(pastedRules);
    };

    window.addEventListener('paste', handleSystemPaste);
    return () => window.removeEventListener('paste', handleSystemPaste);
  }, [group, rules, onChange]);

  const addBtn = menuItems.length ? (
    <Space.Compact size="small">
      <Button
        size="small"
        icon={<PlusOutlined />}
        onClick={() => {
          handleAddRule({ type: RuleType.Redirect });
        }}
      />
      <Dropdown
        menu={{ items: menuItems }}
        placement="bottom"
        autoAdjustOverflow
      >
        <Button size="small" icon={<DownOutlined />} />
      </Dropdown>
    </Space.Compact>
  ) : (
    <Button
      size="small"
      icon={<PlusOutlined />}
      onClick={() => handleAddRule({ type: RuleType.Redirect })}
    />
  );

  const groupActions = (
    <Space size={4}>
      {addBtn}
      <Tooltip
        title={chrome.i18n.getMessage('paste_rule_shortcut_tip', pasteShortcut)}
        placement="top"
      >
        <Button size="small" icon={<SnippetsOutlined />} onClick={handlePasteRule} />
      </Tooltip>
    </Space>
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
                          onDuplicateRule={handleDuplicateRule}
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
                          onDuplicateRule={handleDuplicateRule}
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
                        onDuplicateRule={handleDuplicateRule}
                        onDelete={() => handleDeleteRule(rule.id)}
                      />
                    );
                  }}
                </SortableRule>
              ))}
            </SortableContext>
          </DndContext>
          <div className="group-view-actions">
            {groupActions}
          </div>
        </div>
      ) : (
        <Space className="group-view-content group-view-empty" size="small" direction="vertical">
          <Empty description={false}>
            {groupActions}
          </Empty>
        </Space>
      )}
    </div>
  );
}
