import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { NativeMessagingBridge } from '../bridge.js'
import { generateId } from '../utils.js'

export const updateRuleTool: Tool = {
  name: 'update_rule',
  description: '更新 Camora 扩展中指定规则的字段，仅传入需要修改的字段即可',
  inputSchema: {
    type: 'object',
    properties: {
      groupId: {
        type: 'string',
        description: '规则所在的规则组 ID',
      },
      ruleId: {
        type: 'string',
        description: '要更新的规则 ID，可通过 list_rule_groups 获取',
      },
      source: {
        type: 'string',
        description: '新的匹配 URL 模式',
      },
      sourceType: {
        type: 'string',
        enum: ['urlFilter', 'regexFilter'],
        description: '匹配类型',
      },
      target: {
        type: 'string',
        description: '【redirect 类型】新的重定向目标 URL',
      },
      targetType: {
        type: 'string',
        enum: ['url', 'regexSubstitution'],
        description: '【redirect 类型】目标类型',
      },
      sourceMapUrl: {
        type: 'string',
        description: '【sourceMap 类型】新的 SourceMap URL',
      },
      allowOrigin: {
        type: 'string',
        description: '【cors 类型】新的 Access-Control-Allow-Origin 值',
      },
      allowCredentials: {
        type: 'boolean',
        description: '【cors 类型】是否允许携带凭证',
      },
      allowMethods: {
        type: 'string',
        description: '【cors 类型】允许的 HTTP 方法',
      },
      allowHeaders: {
        type: 'string',
        description: '【cors 类型】允许的请求头',
      },
      maxAge: {
        type: 'number',
        description: '【cors 类型】预检请求缓存时间（秒）',
      },
    },
    required: ['groupId', 'ruleId'],
  },
}

export async function handleUpdateRule(
  bridge: NativeMessagingBridge,
  args: Record<string, unknown>,
): Promise<CallToolResult> {
  const { groupId, ruleId, ...updates } = args as {
    groupId: string
    ruleId: string
  } & Record<string, unknown>

  const response = await bridge.sendRequest({
    id: generateId('req'),
    action: 'updateRule',
    payload: { groupId, ruleId, updates },
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
        text: `规则更新成功：\n${JSON.stringify(response.data, null, 2)}`,
      },
    ],
  }
}
