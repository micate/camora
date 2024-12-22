import React, { useEffect, useState } from 'react'
import { Layout, List, Card, Button, Switch, Form, Input, Modal } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { Rule, RuleGroup } from './types'

const { Header, Content } = Layout

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

  return (
    <Layout className="min-h-screen">
      <Header className="flex items-center justify-between bg-white px-4">
        <h1 className="text-lg font-bold">Camora</h1>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
        >
          Add Group
        </Button>
      </Header>
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
