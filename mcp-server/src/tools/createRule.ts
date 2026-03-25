import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { NativeMessagingBridge } from '../bridge.js'
import { generateId } from '../utils.js'

export const createRuleTool: Tool = {
  name: 'create_rule',
  description: '在指定规则组中创建一条新规则，支持 redirect（URL 重定向）、sourceMap（SourceMap 注入）、cors（CORS 头修改）三种类型',
  inputSchema: {
    type: 'object',
    properties: {
      groupId: {
        type: 'string',
        description: '目标规则组 ID，可通过 list_rule_groups 获取',
      },
      type: {
        type: 'string',
        enum: ['redirect', 'sourceMap', 'cors'],
        description: '规则类型',
      },
      source: {
        type: 'string',
        description: '匹配的 URL 模式，支持通配符或正则表达式',
      },
      sourceType: {
        type: 'string',
        enum: ['urlFilter', 'regexFilter'],
        description: '匹配类型：urlFilter（URL 通配符）或 regexFilter（正则表达式），默认 urlFilter',
      },
      // redirect 规则专属字段
      target: {
        type: 'string',
        description: '【redirect 类型必填】重定向目标 URL',
      },
      targetType: {
        type: 'string',
        enum: ['url', 'regexSubstitution'],
        description: '【redirect 类型】目标类型：url（固定 URL）或 regexSubstitution（正则替换），默认 url',
      },
      // sourceMap 规则专属字段
      sourceMapUrl: {
        type: 'string',
        description: '【sourceMap 类型必填】SourceMap 文件的 URL',
      },
      // cors 规则专属字段
      allowOrigin: {
        type: 'string',
        description: '【cors 类型】Access-Control-Allow-Origin 的值，默认 *',
      },
      allowCredentials: {
        type: 'boolean',
        description: '【cors 类型】是否允许携带凭证',
      },
      allowMethods: {
        type: 'string',
        description: '【cors 类型】允许的 HTTP 方法，如 GET,POST,PUT',
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
    required: ['groupId', 'type', 'source'],
  },
}

export async function handleCreateRule(
  bridge: NativeMessagingBridge,
  args: Record<string, unknown>,
): Promise<CallToolResult> {
  const { groupId, ...ruleData } = args as { groupId: string } & Record<string, unknown>

  // 校验必填字段
  if (ruleData.type === 'redirect' && !ruleData.target) {
    return {
      content: [{ type: 'text', text: '错误：redirect 类型规则必须提供 target 字段' }],
      isError: true,
    }
  }
  if (ruleData.type === 'sourceMap' && !ruleData.sourceMapUrl) {
    return {
      content: [{ type: 'text', text: '错误：sourceMap 类型规则必须提供 sourceMapUrl 字段' }],
      isError: true,
    }
  }

  const response = await bridge.sendRequest({
    id: generateId('req'),
    action: 'createRule',
    payload: { groupId, ruleData },
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
        text: `规则创建成功：\n${JSON.stringify(response.data, null, 2)}`,
      },
    ],
  }
}
