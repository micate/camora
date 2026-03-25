import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { NativeMessagingBridge } from '../bridge.js'
import { generateId } from '../utils.js'

export const deleteRuleTool: Tool = {
  name: 'delete_rule',
  description: '删除 Camora 扩展中指定规则组内的某条规则',
  inputSchema: {
    type: 'object',
    properties: {
      groupId: {
        type: 'string',
        description: '规则所在的规则组 ID',
      },
      ruleId: {
        type: 'string',
        description: '要删除的规则 ID，可通过 list_rule_groups 获取',
      },
    },
    required: ['groupId', 'ruleId'],
  },
}

export async function handleDeleteRule(
  bridge: NativeMessagingBridge,
  args: Record<string, unknown>,
): Promise<CallToolResult> {
  const { groupId, ruleId } = args as { groupId: string; ruleId: string }

  const response = await bridge.sendRequest({
    id: generateId('req'),
    action: 'deleteRule',
    payload: { groupId, ruleId },
  })

  if (!response.success) {
    return {
      content: [{ type: 'text', text: `错误：${response.error}` }],
      isError: true,
    }
  }

  return {
    content: [{ type: 'text', text: `规则 "${ruleId}" 已成功删除` }],
  }
}
