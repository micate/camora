import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Layout } from 'antd';
import { RuleGroup } from "@/types";
import Footer from "../Footer";
import GroupItem from "../GroupItem";
import Header from "../Header";

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
}

export default function Sidebar(props: ISidebarProps) {
  const { groups, onAddGroup, onEditGroup, onDeleteGroup, onCopyGroup, onChangeGroups, activeGroup, onChangeActiveGroup } = props;

  const handleToggleGroup = async (groupId: string, enabled: boolean) => {
    const updatedGroups = groups.map(group =>
      group.id === groupId ? { ...group, enabled } : group
    )
    await chrome.storage.local.set({ groups: updatedGroups })
    onChangeGroups(updatedGroups)
  }

  const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return result;
  };

  const getItemStyle = (isDragging, draggableStyle) => ({
    // some basic styles to make the items look a bit nicer
    userSelect: "none",
    // change background colour if dragging
    background: isDragging ? "lightgreen" : "",
    borderBottom: 'solid 1px #f0f0f0',
    // styles we need to apply on draggables
    ...draggableStyle
  });

  return (
    <Sider width={150} theme="light">
      <div className="app-sider">
        <Header onAddGroup={onAddGroup} />
        <DragDropContext>
          <Droppable droppableId="droppable">
            {(provided, snapshot) => (
              <div
                className="app-items-list"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {groups.map((group, index) => (
                  <Draggable key={group.name} draggableId={group.name} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={getItemStyle(
                          snapshot.isDragging,
                          provided.draggableProps.style
                        )}
                      >
                        <GroupItem
                          active={activeGroup?.id === group.id}
                          item={group}
                          onToggleGroup={(enabled: boolean) => handleToggleGroup(group.id, enabled)}
                          onCopyGroup={onCopyGroup}
                          onEditGroup={onEditGroup}
                          onDeleteGroup={onDeleteGroup}
                          onClick={() => onChangeActiveGroup(group)}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        <Footer />
      </div>
    </Sider>
  );
}