import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { NativeMessagingBridge } from '../bridge.js'
import { generateId } from '../utils.js'

export const deleteGroupTool: Tool = {
  name: 'delete_rule_group',
  description: '删除 Camora 扩展中指定的规则组（同时删除组内所有规则）',
  inputSchema: {
    type: 'object',
    properties: {
      groupId: {
        type: 'string',
        description: '要删除的规则组 ID，可通过 list_rule_groups 获取',
      },
    },
    required: ['groupId'],
  },
}

export async function handleDeleteGroup(
  bridge: NativeMessagingBridge,
  args: Record<string, unknown>,
): Promise<CallToolResult> {
  const { groupId } = args as { groupId: string }

  const response = await bridge.sendRequest({
    id: generateId('req'),
    action: 'deleteGroup',
    payload: { groupId },
  })

  if (!response.success) {
    return {
      content: [{ type: 'text', text: `错误：${response.error}` }],
      isError: true,
    }
  }

  return {
    content: [{ type: 'text', text: `规则组 "${groupId}" 已成功删除` }],
  }
}
