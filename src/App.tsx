import React, { useEffect, useState } from 'react'
import { Layout, Form, Input, Modal, Empty } from 'antd'
import Landing from './components/Landing';
import GroupView from './components/GroupView';
import Sidebar from './components/Sidebar';
import type { RuleGroup } from './types'
import { createGroup } from './utils/createGroup';
import { cleanupGroups } from './utils/cleanupGroups';
import { hashMessage } from './utils/hashMessage';
import './App.less';

const { Content } = Layout

const App: React.FC = () => {
  const [groups, setGroups] = useState<RuleGroup[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [activeGroup, setActiveGroup] = useState<RuleGroup | null>(null)
  const [editGroup, setEditGroup] = useState<RuleGroup | null>(null)
  const [landing, setLanding] = useState(true)
  const [rulesCount, setRulesCount] = useState(0)
  const [regexRulesCount, setRegexRulesCount] = useState(0)
  const [form] = Form.useForm()
  const inputRef = React.createRef<any>()

  useEffect(() => {
    chrome.storage.local.get(['activeGroupId', 'groups']).then(({ activeGroupId, groups = [] }) => {
      if (groups?.length) {
        setGroups(groups)
        setActiveGroup(groups.find((g: RuleGroup) => g.id === activeGroupId) || groups[0])
      } else {
        const group = createGroup(chrome.i18n.getMessage('group_default_name'));
        setGroups([group]);
        setActiveGroup(group);
      }

      setLanding(false)
    })
  }, [])

  useEffect(() => {
    const countEnabledRules = () => {
      chrome.declarativeNetRequest.getDynamicRules().then((rules: chrome.declarativeNetRequest.Rule[]) => {
        setRulesCount(rules.length)
        setRegexRulesCount(rules.filter((rule) => rule.condition.regexFilter).length)
      })
    }

    // 初始化时计算一次
    countEnabledRules()

    // 监听规则变化重新计算
    chrome.storage.onChanged.addListener(countEnabledRules)
    return () => {
      chrome.storage.onChanged.removeListener(countEnabledRules)
    }
  }, [])

  useEffect(() => {
    const sync = async () => {
      const [local, sync] = await Promise.all([
        chrome.storage.local.get('groups'),
        chrome.storage.sync.get('groups'), 
      ]);

      if (!sync.groups?.length) {
        return;
      }

      const localGroupString = JSON.stringify(cleanupGroups(local.groups));
      const syncGroupString = JSON.stringify(cleanupGroups(sync.groups));
      if (localGroupString === syncGroupString) {
        return;
      }

      const syncGroupHash = await hashMessage(syncGroupString);
      chrome.storage.local.get('ignoredSync').then(({ ignoredSync }) => {
        if (ignoredSync === syncGroupHash) {
          return;
        }

        Modal.confirm({
          title: chrome.i18n.getMessage('sync_confirm_title'),
          content: chrome.i18n.getMessage('sync_confirm_content', [`${sync.groups.length}`, `${local.groups.length}`]),
          onOk: () => {
            chrome.storage.local.set({
              groups: sync.groups,
              activeGroupId: sync.groups[0].id,
              syncStatus: { success: new Date().toLocaleString() }
            });
            location.reload();
          },
          onCancel: () => {
            chrome.storage.local.set({
              ignoredSync: syncGroupHash,
            });
          }
        });
      })
    }
    sync()
  }, []);

  useEffect(() => {
    if (activeGroup) {
      chrome.storage.local.set({ activeGroupId: activeGroup.id })
    }
  }, [activeGroup])

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
    await chrome.storage.local.set({ groups: updatedGroups })
    setGroups(updatedGroups)
    setActiveGroup(newGroup);
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
        rulesCount={rulesCount}
        regexRulesCount={regexRulesCount}
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
            <Input ref={inputRef} />
          </Form.Item>
        </Form>
      </Modal>

      <Landing visible={landing} />
    </Layout>
  )
}

export default App
