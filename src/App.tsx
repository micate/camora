import React, { useEffect, useState } from 'react'
import { Layout, List, Button, Form, Input, Modal, Avatar } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import GroupItem from './components/GroupItem';
import GroupView from './components/GroupView';
import type { RuleGroup } from './types'
import Logo from './logo.png';
import './App.less';

const { Sider, Content } = Layout

const App: React.FC = () => {
  const [groups, setGroups] = useState<RuleGroup[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [activeGroup, setActiveGroup] = useState<RuleGroup | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    chrome.storage.local.get('groups').then(({ groups = [] }) => {
      const mockGroups = [
        {
          id: '1',
          name: 'Group 1',
          rules: [
            {
              id: '1',
              source: 'https://example.com',
              target: 'https://example.com',
              enabled: true
            },
            {
              id: '2',
              source: 'https://example.com',
              target: 'https://example.com',
              enabled: false
            },
            {
              id: '3',
              source: 'https://example.com',
              target: 'https://example.com',
              enabled: true
            },
            {
              id: '4',
              source: 'https://example.com',
              target: 'https://example.com',
              enabled: false
            },
            {
              id: '5',
              source: 'https://example.com',
              target: 'https://example.com',
              enabled: true
            },
            {
              id: '6',
              source: 'https://example.com',
              target: 'https://example.com',
              enabled: false
            }
          ],
          enabled: true
        },
        {
          id: '2',
          name: 'Group 2',
          rules: [],
          enabled: true
        }
      ];
      // setGroups(groups)
      setGroups(mockGroups);
      setActiveGroup(mockGroups[0]);
    })
  }, [])

  const handleSave = async (values: any) => {
    const newGroup: RuleGroup = {
      id: Date.now().toString(),
      name: values.name,
      rules: [],
      enabled: true
    }
    const updatedGroups = [...groups, newGroup]
    await chrome.storage.local.set({ groups: updatedGroups })
    setGroups(updatedGroups)
    setIsModalVisible(false)
    form.resetFields()
  }

  const handleToggleGroup = async (groupId: string, enabled: boolean) => {
    const updatedGroups = groups.map(group =>
      group.id === groupId ? { ...group, enabled } : group
    )
    await chrome.storage.local.set({ groups: updatedGroups })
    setGroups(updatedGroups)
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
    <Layout className="app-layout">
      <Sider width={150} theme="light">
        <div className="app-sider">
          <div className="app-header">
            <Avatar size="small" src={Logo} alt="Camora" />
            <Button
              size="small"
              shape="circle"
              icon={<PlusOutlined />}
              onClick={() => setIsModalVisible(true)}
            />
          </div>
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
                            handleToggleGroup={handleToggleGroup}
                            onClick={() => setActiveGroup(group)}
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
          <div className="app-footer">
            Settings
          </div>
        </div>
      </Sider>
      <Content className="app-content">
        {activeGroup ? (
          <GroupView key={activeGroup?.id} group={activeGroup} />
        ) : null}
      </Content>

      <Modal
        title="Add Rule Group"
        open={isModalVisible}
        onOk={form.submit}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Form.Item
            name="name"
            label="Group Name"
            rules={[{ required: true, message: 'Please input group name!' }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  )
}

export default App
