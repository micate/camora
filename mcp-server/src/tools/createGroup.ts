import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { NativeMessagingBridge } from '../bridge.js'
import { generateId } from '../utils.js'

export const createGroupTool: Tool = {
  name: 'create_rule_group',
  description: '在 Camora 扩展中创建一个新的规则组',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: '规则组的名称',
      },
    },
    required: ['name'],
  },
}

export async function handleCreateGroup(
  bridge: NativeMessagingBridge,
  args: Record<string, unknown>,
): Promise<CallToolResult> {
  const { name } = args as { name: string }

  const response = await bridge.sendRequest({
    id: generateId('req'),
    action: 'createGroup',
    payload: { name },
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
        text: `规则组 "${name}" 创建成功：\n${JSON.stringify(response.data, null, 2)}`,
      },
    ],
  }
}
