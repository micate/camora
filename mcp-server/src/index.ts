#!/usr/bin/env node
/**
 * Camora MCP Server
 *
 * 通过 Native Messaging 协议与 Camora Chrome 扩展通信，
 * 将扩展的规则管理能力暴露为 MCP Tools，供 AI 客户端调用。
 *
 * 启动方式：node dist/index.js
 * 配置方式：在 Claude Desktop 等 MCP 客户端中注册此 Server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'

import { NativeMessagingBridge } from './bridge.js'

import { listGroupsTool, handleListGroups } from './tools/listGroups.js'
import { createGroupTool, handleCreateGroup } from './tools/createGroup.js'
import { deleteGroupTool, handleDeleteGroup } from './tools/deleteGroup.js'
import { toggleGroupTool, handleToggleGroup } from './tools/toggleGroup.js'
import { createRuleTool, handleCreateRule } from './tools/createRule.js'
import { updateRuleTool, handleUpdateRule } from './tools/updateRule.js'
import { deleteRuleTool, handleDeleteRule } from './tools/deleteRule.js'
import { toggleRuleTool, handleToggleRule } from './tools/toggleRule.js'

const ALL_TOOLS = [
  listGroupsTool,
  createGroupTool,
  deleteGroupTool,
  toggleGroupTool,
  createRuleTool,
  updateRuleTool,
  deleteRuleTool,
  toggleRuleTool,
]

async function main() {
  const bridge = new NativeMessagingBridge()

  const server = new Server(
    {
      name: 'camora-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    },
  )

  // 列出所有可用工具
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: ALL_TOOLS }
  })

  // 处理工具调用
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params
    const toolArgs = (args ?? {}) as Record<string, unknown>

    switch (name) {
      case 'list_rule_groups':
        return handleListGroups(bridge)

      case 'create_rule_group':
        return handleCreateGroup(bridge, toolArgs)

      case 'delete_rule_group':
        return handleDeleteGroup(bridge, toolArgs)

      case 'toggle_rule_group':
        return handleToggleGroup(bridge, toolArgs)

      case 'create_rule':
        return handleCreateRule(bridge, toolArgs)

      case 'update_rule':
        return handleUpdateRule(bridge, toolArgs)

      case 'delete_rule':
        return handleDeleteRule(bridge, toolArgs)

      case 'toggle_rule':
        return handleToggleRule(bridge, toolArgs)

      default:
        return {
          content: [{ type: 'text', text: `未知工具：${name}` }],
          isError: true,
        }
    }
  })

  // 使用 stdio 传输（MCP 标准方式）
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch((error) => {
  process.stderr.write(`Camora MCP Server 启动失败：${error}\n`)
  process.exit(1)
})
