import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { NativeMessagingBridge } from '../bridge.js'
import { generateId } from '../utils.js'

export const toggleRuleTool: Tool = {
  name: 'toggle_rule',
  description: '启用或禁用 Camora 扩展中指定的某条规则',
  inputSchema: {
    type: 'object',
    properties: {
      groupId: {
        type: 'string',
        description: '规则所在的规则组 ID',
      },
      ruleId: {
        type: 'string',
        description: '规则 ID，可通过 list_rule_groups 获取',
      },
      enabled: {
        type: 'boolean',
        description: 'true 表示启用，false 表示禁用',
      },
    },
    required: ['groupId', 'ruleId', 'enabled'],
  },
}

export async function handleToggleRule(
  bridge: NativeMessagingBridge,
  args: Record<string, unknown>,
): Promise<CallToolResult> {
  const { groupId, ruleId, enabled } = args as {
    groupId: string
    ruleId: string
    enabled: boolean
  }

  const response = await bridge.sendRequest({
    id: generateId('req'),
    action: 'toggleRule',
    payload: { groupId, ruleId, enabled },
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
        text: `规则 "${ruleId}" 已${enabled ? '启用' : '禁用'}`,
      },
    ],
  }
}
