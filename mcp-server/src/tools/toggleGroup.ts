import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { NativeMessagingBridge } from '../bridge.js'
import { generateId } from '../utils.js'

export const toggleGroupTool: Tool = {
  name: 'toggle_rule_group',
  description: '启用或禁用 Camora 扩展中指定的规则组',
  inputSchema: {
    type: 'object',
    properties: {
      groupId: {
        type: 'string',
        description: '规则组 ID，可通过 list_rule_groups 获取',
      },
      enabled: {
        type: 'boolean',
        description: 'true 表示启用，false 表示禁用',
      },
    },
    required: ['groupId', 'enabled'],
  },
}

export async function handleToggleGroup(
  bridge: NativeMessagingBridge,
  args: Record<string, unknown>,
): Promise<CallToolResult> {
  const { groupId, enabled } = args as { groupId: string; enabled: boolean }

  const response = await bridge.sendRequest({
    id: generateId('req'),
    action: 'toggleGroup',
    payload: { groupId, enabled },
  })

  if (!response.success) {
    return {
      content: [{ type: 'text', text: `错误：${response.error}` }],
      isError: true,
    }
  }

  return {
    content: [
      {
        type: 'text',
        text: `规则组 "${groupId}" 已${enabled ? '启用' : '禁用'}`,
      },
    ],
  }
}
