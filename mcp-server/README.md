# Camora MCP Server

将 [Camora](https://github.com/micate/camora) Chrome 扩展的规则管理能力暴露为 [MCP Tools](https://modelcontextprotocol.io)，让 Claude 等 AI 客户端可以直接管理请求重定向、SourceMap、CORS 等规则。

## 工作原理

```
AI 客户端 (Claude Desktop)
    ↕ MCP 协议 (stdio)
Camora MCP Server (Node.js)
    ↕ Native Messaging 协议
Camora Chrome 扩展 (background service worker)
    ↕ chrome.storage.local / declarativeNetRequest
Chrome 网络层
```

MCP Server 通过 Chrome 的 [Native Messaging](https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging) 机制与扩展通信，所有规则数据持久化在 `chrome.storage.local` 中。

## 前置要求

- **Node.js** >= 18
- **npm** 或 **pnpm**
- **Chrome** 或 **Chromium** 浏览器
- 已安装并启用 **Camora 扩展**
- 支持 **macOS** 或 **Linux**（暂不支持 Windows）

## 安装

### 1. 安装包

在 `mcp-server` 目录下执行：

```bash
npm install
```

`postinstall` 钩子会自动完成以下操作：

1. 编译 TypeScript 构建产物
2. 生成启动包装脚本（`native-host/camora-mcp-wrapper.sh`）
3. 注册 Native Messaging Host 配置文件到 Chrome / Chromium

### 2. 配置 Claude Desktop

安装完成后，终端会输出 Claude Desktop 配置片段，将其添加到配置文件中：

**配置文件路径：**
- macOS：`~/Library/Application Support/Claude/claude_desktop_config.json`
- Linux：`~/.config/Claude/claude_desktop_config.json`

**配置内容：**

```json
{
  "mcpServers": {
    "camora": {
      "command": "npx",
      "args": [
        "-y",
        "camora-mcp-server"
      ]
    }
  }
}
```

### 3. 重启

1. 重启 Chrome（使 Native Messaging Host 注册生效）
2. 重启 Claude Desktop

## 可用工具

安装完成后，AI 客户端可以使用以下工具：

| 工具名 | 说明 |
|---|---|
| `list_rule_groups` | 列出所有规则组及其规则 |
| `create_rule_group` | 创建新规则组 |
| `delete_rule_group` | 删除规则组 |
| `toggle_rule_group` | 启用 / 禁用规则组 |
| `create_rule` | 在指定规则组中创建规则 |
| `update_rule` | 更新规则配置 |
| `delete_rule` | 删除规则 |
| `toggle_rule` | 启用 / 禁用规则 |

### 规则类型

| 类型 | 说明 |
|---|---|
| `redirect` | 将请求重定向到另一个 URL |
| `sourceMap` | 注入自定义 SourceMap URL |
| `cors` | 修改响应的 CORS 头 |

## 使用示例

在 Claude 中，你可以用自然语言描述需求，例如：

- *"帮我创建一个规则组，把所有 `api.example.com` 的请求重定向到 `localhost:3000`"*
- *"列出当前所有规则组"*
- *"禁用「开发环境」规则组"*
- *"删除 ID 为 xxx 的规则"*

## 卸载

在 `mcp-server` 目录下执行：

```bash
npm uninstall camora-mcp-server
```

`preuninstall` 钩子会自动移除 Native Messaging Host 配置文件和包装脚本。

卸载后还需手动移除 Claude Desktop 配置文件中的 `camora` 条目，然后重启 Claude Desktop。

## 开发

```bash
# 安装依赖
pnpm install

# 监听模式编译
pnpm dev

# 一次性编译
pnpm build

# 直接运行（需先编译）
pnpm start
```

## 故障排查

**AI 客户端看不到 Camora 工具**
- 确认 Claude Desktop 配置文件中的路径正确
- 重启 Claude Desktop

**工具调用超时或失败**
- 确认 Camora 扩展已安装并处于启用状态
- 重启 Chrome，确保 Native Messaging Host 已注册
- 检查 `chrome://extensions` 中扩展的错误日志

**Native Messaging 连接失败**
- 确认 `native-host/com.camora.mcp.json` 中的路径与实际安装路径一致
- 重新运行 `npm install` 修复注册
