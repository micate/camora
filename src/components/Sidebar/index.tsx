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
import Footer from "../Footer";
import GroupItem from "../GroupItem";
import Header from "../Header";
import './index.less';

const { Sider } = Layout

interface ISidebarProps {
  groups: RuleGroup[];
  onAddGroup: () => void;
  onEditGroup: (group: RuleGroup) => void;
  onDeleteGroup: (group: RuleGroup) => void;
  onCopyGroup: (group: RuleGroup) => void;
  onChangeGroups: (groups: RuleGroup[]) => void;
  activeGroup: RuleGroup | null;
  onChangeActiveGroup: (group: RuleGroup | null) => void;
  rulesCount: number;
  regexRulesCount: number;
}

export default function Sidebar(props: ISidebarProps) {
  const {
    groups,
    onAddGroup,
    onEditGroup,
    onDeleteGroup,
    onCopyGroup,
    onChangeGroups,
    activeGroup,
    onChangeActiveGroup,
    rulesCount,
    regexRulesCount
  } = props;

  const sensors = useSensors(
    useSensor(PointerSensor),
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
  }

  const handleDragEnd = (event: any) => {
    const {active, over} = event;
    
    if (active.id !== over.id) {
      const oldIndex = groups.findIndex(group => group.id === active.id);
      const newIndex = groups.findIndex(group => group.id === over.id);
      const updatedGroups = arrayMove(groups, oldIndex, newIndex);
      chrome.storage.local.set({ groups: updatedGroups })
      onChangeGroups(updatedGroups);
    }
  }

  return (
    <Sider width={150} theme="light">
      <div className="app-sidebar">
        <Header />
        {groups?.length ? (
          <div className="app-items-list">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={groups}
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
        <Footer
          rulesCount={rulesCount}
          regexRulesCount={regexRulesCount}
          onAddGroup={onAddGroup}
        />
      </div>
    </Sider>
  );
}