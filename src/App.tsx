import React, { useEffect, useState } from 'react'
import { Layout, Form, Input, Modal } from 'antd'
import GroupView from './components/GroupView';
import Sidebar from './components/Sidebar';
import type { RuleGroup } from './types'
import { createGroup } from './utils/createGroup';
import './App.less';

const { Content } = Layout

const App: React.FC = () => {
  const [groups, setGroups] = useState<RuleGroup[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [activeGroup, setActiveGroup] = useState<RuleGroup | null>(null)
  const [editGroup, setEditGroup] = useState<RuleGroup | null>(null)
  const [form] = Form.useForm()
  const inputRef = React.createRef()

  useEffect(() => {
    chrome.storage.local.get('groups').then(({ groups = [] }) => {
      if (groups?.length) {
        setGroups(groups)
        setActiveGroup(groups[0]);
      } else {
        const group = createGroup(chrome.i18n.getMessage('group_default_name'));
        setGroups([group]);
        setActiveGroup(group);
      }
    })
  }, [])

  useEffect(() => {
    if (editGroup) {
      form.setFieldsValue({ name: editGroup.name })
    }
  }, [editGroup])

  const handleAddGroup = () => {
    setIsModalVisible(true)
  }

  const handleEditGroup = (group: RuleGroup) => {
    setEditGroup(group)
    setIsModalVisible(true)
  }

  const handleSaveGroup = async (values: any) => {
    let updatedGroups;
    if (editGroup) {
      updatedGroups = groups.map((group) =>
        group.id === editGroup.id ? { ...group, name: values.name } : group
      );
    } else {
      const newGroup = createGroup(values.name)
      updatedGroups = [...groups, newGroup]
    }
    await chrome.storage.local.set({ groups: updatedGroups })
    setGroups(updatedGroups)
    setActiveGroup(editGroup || updatedGroups[updatedGroups.length - 1]);
    setEditGroup(null)
    setIsModalVisible(false)
    form.resetFields()
  }

  const handleDeleteGroup = async (group: RuleGroup) => {
    const updatedGroups = groups.filter((g) => g.id !== group.id)
    await chrome.storage.local.set({ groups: updatedGroups })
    setGroups(updatedGroups)

    const length = updatedGroups.length
    if (length > 1) {
      setActiveGroup(updatedGroups[length - 2])
    } else {
      setActiveGroup(updatedGroups[0] || null)
    }
  }

  const handleCopyGroup = async (group: RuleGroup) => {
    const newGroup = createGroup(chrome.i18n.getMessage('group_name_cloned', group.name))
    newGroup.rules = JSON.parse(JSON.stringify(group.rules))
    newGroup.enabled = group.enabled
    const sourceIndex = groups.findIndex((g) => g.id === group.id)
    const updatedGroups = [...groups]
    updatedGroups.splice(sourceIndex + 1, 0, newGroup)
    await chrome.storage.local.set({ groups: updatedGroups })
    setGroups(updatedGroups)
    setActiveGroup(newGroup)
  }

  const handleGroupChange = async (group: RuleGroup) => {
    const updatedGroups = groups.map((g) => (g.id === group.id ? group : g))
    await chrome.storage.local.set({ groups: updatedGroups })
    setGroups(updatedGroups)
    setActiveGroup(group)
  }

  return (
    <Layout className="app-layout">
      <Sidebar
        groups={groups}
        onAddGroup={handleAddGroup}
        onEditGroup={handleEditGroup}
        onDeleteGroup={handleDeleteGroup}
        onCopyGroup={handleCopyGroup}
        activeGroup={activeGroup}
        onChangeActiveGroup={setActiveGroup}
        onChangeGroups={setGroups}
      />
      <Content className="app-content">
        {activeGroup ? (
          <GroupView
            key={activeGroup?.id}
            group={activeGroup}
            onChange={handleGroupChange}
          />
        ) : null}
      </Content>

      <Modal
        title={false}
        open={isModalVisible}
        onOk={form.submit}
        onCancel={() => setIsModalVisible(false)}
        afterOpenChange={(open) => {
          if (open && inputRef.current) {
            inputRef.current.focus()
          }
        }}
        width={250}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveGroup}
        >
          <Form.Item
            name="name"
            label={chrome.i18n.getMessage('group_name')}
            rules={[{ required: true, message: chrome.i18n.getMessage('group_name_required') }]}
          >
            <Input ref={inputRef} />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  )
}

export default App
