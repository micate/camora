import React, { useEffect, useState } from 'react'
import { Layout, List, Card, Button, Switch, Form, Input, Modal, Avatar } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import GroupItem from './components/GroupItem';
import type { RuleGroup } from './types'
import Logo from './logo.png';
import './App.less';

const { Sider, Content } = Layout

const App: React.FC = () => {
  const [groups, setGroups] = useState<RuleGroup[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    chrome.storage.local.get('groups').then(({ groups = [] }) => {
      setGroups(groups)
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
    padding: 8,
  
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
                          <GroupItem item={group} handleToggleGroup={handleToggleGroup} />
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
      <Content className="p-4">
        <List
          grid={{ gutter: 16, column: 1 }}
          dataSource={groups}
          renderItem={group => (
            <List.Item>
              <Card
                title={group.name}
                extra={
                  <Switch
                    checked={group.enabled}
                    onChange={(checked) => handleToggleGroup(group.id, checked)}
                  />
                }
              >
                {/* Rule list will be implemented here */}
              </Card>
            </List.Item>
          )}
        />
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
