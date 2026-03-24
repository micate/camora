import { useEffect, useRef } from 'react';
import { Layout, Empty } from 'antd';
import {
  DndContext,
  closestCenter,
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
import { RuleGroup } from "@/types";
import GroupItem from "../GroupItem";
import './index.less';

const { Sider } = Layout

interface ISidebarProps {
  groups: RuleGroup[];
  onEditGroup: (group: RuleGroup) => void;
  onDeleteGroup: (group: RuleGroup) => void;
  onCopyGroup: (group: RuleGroup) => void;
  onChangeGroups: (groups: RuleGroup[]) => void;
  activeGroup: RuleGroup | null;
  onChangeActiveGroup: (group: RuleGroup | null) => void;
}

export default function Sidebar(props: ISidebarProps) {
  const {
    groups,
    onEditGroup,
    onDeleteGroup,
    onCopyGroup,
    onChangeGroups,
    activeGroup,
    onChangeActiveGroup,
  } = props;
  const sidebarRef = useRef<HTMLDivElement>(null);
  const itemsListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkOverflow = () => {
      if (sidebarRef.current && itemsListRef.current) {
        if (itemsListRef.current.scrollTop > 0) {
          sidebarRef.current.classList.add('fn-overflow-top');
        } else {
          sidebarRef.current.classList.remove('fn-overflow-top');
        }
        if (itemsListRef.current.scrollTop + itemsListRef.current.clientHeight < itemsListRef.current.scrollHeight) {
          sidebarRef.current.classList.add('fn-overflow-bottom');
        } else {
          sidebarRef.current.classList.remove('fn-overflow-bottom');
        }
      }
    }
    checkOverflow();
    if (itemsListRef.current) {
      itemsListRef.current.addEventListener('scroll', checkOverflow);
    }
    return () => {
      if (itemsListRef.current) {
        itemsListRef.current.removeEventListener('scroll', checkOverflow);
      }
    }
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleToggleGroup = async (groupId: string, enabled: boolean) => {
    const updatedGroups = groups.map(group =>
      group.id === groupId ? { ...group, enabled } : group
    )
    await chrome.storage.local.set({ groups: updatedGroups })
    onChangeGroups(updatedGroups)
    const activeGroup = updatedGroups.find(group => group.id === groupId)
    if (activeGroup) {
      onChangeActiveGroup(activeGroup)
    }
  }

  const handleDragEnd = (event: any) => {
    const {active, over} = event;

    if (!over || active.id !== over.id) {
      if (!over) {
        return;
      }
      const oldIndex = groups.findIndex(group => group.id === active.id);
      const newIndex = groups.findIndex(group => group.id === over.id);
      const updatedGroups = arrayMove(groups, oldIndex, newIndex);
      chrome.storage.local.set({ groups: updatedGroups })
      onChangeGroups(updatedGroups);
    }
  }

  return (
    <Sider width={180} theme="light">
      <div
        ref={sidebarRef}
        className="app-sidebar"
      >
        {groups?.length ? (
          <div
            ref={itemsListRef}
            className="app-items-list"
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={groups.map(group => group.id)}
                strategy={verticalListSortingStrategy}
              >
                {groups.map((group: any) => (
                  <GroupItem
                    key={group.id}
                    id={group.id}
                    active={activeGroup?.id === group.id}
                    item={group}
                    onToggleGroup={(enabled: boolean) => handleToggleGroup(group.id, enabled)}
                    onCopyGroup={onCopyGroup}
                    onEditGroup={onEditGroup}
                    onDeleteGroup={onDeleteGroup}
                    onClick={() => onChangeActiveGroup(group)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        ) : (
          <div className="app-items-list app-items-list-empty">
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={false} />
          </div>
        )}
      </div>
    </Sider>
  );
}
