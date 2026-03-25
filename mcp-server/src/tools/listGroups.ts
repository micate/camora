import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { NativeMessagingBridge } from '../bridge.js'
import { generateId } from '../utils.js'

export const listGroupsTool: Tool = {
  name: 'list_rule_groups',
  description: '列出 Camora 扩展中所有规则组及其包含的规则',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
}

export async function handleListGroups(bridge: NativeMessagingBridge): Promise<CallToolResult> {
  const response = await bridge.sendRequest({
    id: generateId('req'),
    action: 'listGroups',
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
        text: JSON.stringify(response.data, null, 2),
      },
    ],
  }
}
