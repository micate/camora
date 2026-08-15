import React, { useEffect, useRef, useState } from 'react'
import { Layout, Form, Input, Modal, Empty } from 'antd'
import Landing from '../../components/Landing';
import Header from '../../components/Header';
import GroupView from '../../components/GroupView';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import type { RuleGroup } from '../../types'
import { createGroup } from '../../utils/createGroup';
import { writeGroups } from '../../utils/writeGroups';
import './App.less';

const { Content } = Layout

const App: React.FC = () => {
  const [groups, setGroups] = useState<RuleGroup[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [activeGroup, setActiveGroup] = useState<RuleGroup | null>(null)
  const [editGroup, setEditGroup] = useState<RuleGroup | null>(null)
  const [landing, setLanding] = useState(true)
  const [form] = Form.useForm()
  const inputRef = useRef<any>(null)
  const fromCopy = useRef<boolean>(false)

  useEffect(() => {
    chrome.storage.local.get(['activeGroupId', 'groups']).then(async ({ activeGroupId, groups = [] }) => {
      if (groups?.length) {
        setGroups(groups)
        setActiveGroup(groups.find((g: RuleGroup) => g.id === activeGroupId) || groups[0])
      } else {
        const group = createGroup(chrome.i18n.getMessage('group_default_name'));
        await writeGroups([group]);
        setGroups([group]);
        setActiveGroup(group);
      }

      setLanding(false)
    })
  }, [])

  useEffect(() => {
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string,
    ) => {
      if (area !== 'local' || !changes.groups) return;
      const nextGroups = Array.isArray(changes.groups.newValue) ? changes.groups.newValue : [];
      setGroups(nextGroups);
      setActiveGroup((current) => {
        if (!nextGroups.length) return null;
        return nextGroups.find((group: RuleGroup) => group.id === current?.id) || nextGroups[0];
      });
    };
    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, [])

  useEffect(() => {
    chrome.storage.local.set({ activeGroupId: activeGroup?.id })
    if (fromCopy.current) {
      fromCopy.current = false
      handleEditGroup(activeGroup as RuleGroup);
    }

    const groupNode = document.querySelector(`[data-group-id="${activeGroup?.id}"]`)
    if (groupNode) {
      groupNode.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [activeGroup])

  useEffect(() => {
    if (!groups.length) {
      if (activeGroup !== null) {
        setActiveGroup(null);
      }
      return;
    }

    const matchedGroup = activeGroup ? groups.find((group) => group.id === activeGroup.id) : null;
    const nextActiveGroup = matchedGroup || groups[0];

    if (nextActiveGroup.id !== activeGroup?.id) {
      setActiveGroup(nextActiveGroup);
    }
  }, [groups, activeGroup])

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
    let newGroup: RuleGroup;
    if (editGroup) {
      newGroup = { ...editGroup, name: values.name }
      updatedGroups = groups.map((group) =>
        group.id === editGroup.id ? newGroup : group
      );
    } else {
      newGroup = createGroup(values.name)
      updatedGroups = [...groups, newGroup]
    }
    await writeGroups(updatedGroups)
    setGroups(updatedGroups)
    setActiveGroup(newGroup);
    setEditGroup(null)
    setIsModalVisible(false)
    form.resetFields()
  }

  const handleDeleteGroup = async (group: RuleGroup) => {
    const updatedGroups = groups.filter((g) => g.id !== group.id)
    await writeGroups(updatedGroups)
    setGroups(updatedGroups)

    const index = groups.findIndex((g: RuleGroup) => g.id === group?.id);
    if (updatedGroups[index]) {
      setActiveGroup(updatedGroups[index])
    } else if (updatedGroups[index - 1]) {
      setActiveGroup(updatedGroups[index - 1])
    } else {
      setActiveGroup(null)
    }
  }

  const handleCopyGroup = async (group: RuleGroup) => {
    const newGroup = createGroup(chrome.i18n.getMessage('group_name_cloned', group.name))
    newGroup.rules = JSON.parse(JSON.stringify(group.rules))
    newGroup.enabled = group.enabled
    const sourceIndex = groups.findIndex((g) => g.id === group.id)
    const updatedGroups = [...groups]
    updatedGroups.splice(sourceIndex + 1, 0, newGroup)
    await writeGroups(updatedGroups)
    setGroups(updatedGroups)
    fromCopy.current = true
    setActiveGroup(newGroup)
  }

  const handleGroupChange = async (group: RuleGroup) => {
    const updatedGroups = groups.map((g) => (g.id === group.id ? group : g))
    // Update the sortable UI immediately. Waiting for storage first makes a
    // dropped item briefly render at its previous index and appear to bounce.
    setGroups(updatedGroups)
    setActiveGroup(group)
    await writeGroups(updatedGroups)
  }

  return (
    <Layout className="app-layout">
      <Header
        activeGroup={activeGroup || null}
        onAddGroup={handleAddGroup}
        onChangeActiveGroup={(groupId: string) => {
          const group = groups.find((g: RuleGroup) => g.id === groupId)
          setActiveGroup(group || null);
        }}
      />
      <div className="app-content-container">
        <Sidebar
          groups={groups}
          onEditGroup={handleEditGroup}
          onDeleteGroup={handleDeleteGroup}
          onCopyGroup={handleCopyGroup}
          activeGroup={activeGroup}
          onChangeActiveGroup={setActiveGroup}
          onChangeGroups={setGroups}
        />
        {activeGroup ? (
          <Content className="app-content">
            <GroupView
              key={activeGroup?.id}
              group={activeGroup}
              onChange={handleGroupChange}
            />
          </Content>
        ) : (
          <Content className="app-content app-content-empty">
            <Empty description={false} />
          </Content>
        )}
      </div>

      <Footer />

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
            style={{ marginBottom: 0 }}
          >
            <Input ref={inputRef} maxLength={34} />
          </Form.Item>
        </Form>
      </Modal>

      <Landing open={landing} />
    </Layout>
  )
}

export default App
