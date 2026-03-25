/**
 * Native Messaging 桥接层
 *
 * Chrome Native Messaging 协议规范：
 * - 每条消息以 4 字节小端序 uint32 表示消息长度，后跟 JSON 字符串
 * - 标准输入读取来自扩展的响应，标准输出发送请求给扩展
 * - 扩展侧通过 chrome.runtime.connectNative 建立连接
 *
 * 注意：MCP Server 作为 Native Messaging Host，扩展是发起方，
 * 但在此架构中我们反转使用：MCP Server 主动发送命令，扩展响应。
 * 实际上 Native Messaging 是扩展连接到 Host，Host 通过 stdin/stdout 通信。
 */

import { NativeRequest, NativeResponse } from './types.js'

type PendingRequest = {
  resolve: (response: NativeResponse) => void
  reject: (error: Error) => void
  timer: NodeJS.Timeout
}

const NATIVE_MESSAGE_TIMEOUT_MS = 10_000

export class NativeMessagingBridge {
  private pendingRequests = new Map<string, PendingRequest>()
  private messageBuffer = Buffer.alloc(0)
  private isConnected = false

  constructor() {
    this.setupStdinReader()
  }

  /**
   * 从 stdin 读取 Native Messaging 格式的消息（来自 Chrome 扩展的响应）
   */
  private setupStdinReader(): void {
    process.stdin.on('data', (chunk: Buffer) => {
      this.messageBuffer = Buffer.concat([this.messageBuffer, chunk])
      this.processBuffer()
    })

    process.stdin.on('end', () => {
      this.isConnected = false
      // 拒绝所有等待中的请求
      for (const [requestId, pending] of this.pendingRequests) {
        clearTimeout(pending.timer)
        pending.reject(new Error('Native Messaging connection closed'))
        this.pendingRequests.delete(requestId)
      }
    })

    process.stdin.resume()
    this.isConnected = true
  }

  /**
   * 处理缓冲区，解析完整的 Native Messaging 消息帧
   */
  private processBuffer(): void {
    // Native Messaging 消息格式：4 字节长度头 + JSON 内容
    while (this.messageBuffer.length >= 4) {
      const messageLength = this.messageBuffer.readUInt32LE(0)

      if (this.messageBuffer.length < 4 + messageLength) {
        // 数据不完整，等待更多数据
        break
      }

      const messageJson = this.messageBuffer.slice(4, 4 + messageLength).toString('utf-8')
      this.messageBuffer = this.messageBuffer.slice(4 + messageLength)

      try {
        const response = JSON.parse(messageJson) as NativeResponse
        this.handleIncomingResponse(response)
      } catch {
        // 忽略无法解析的消息
      }
    }
  }

  /**
   * 处理来自扩展的响应，匹配到对应的 pending 请求
   */
  private handleIncomingResponse(response: NativeResponse): void {
    const pending = this.pendingRequests.get(response.id)
    if (!pending) return

    clearTimeout(pending.timer)
    this.pendingRequests.delete(response.id)
    pending.resolve(response)
  }

  /**
   * 向 Chrome 扩展发送命令，返回 Promise 等待响应
   */
  sendRequest(request: NativeRequest): Promise<NativeResponse> {
    return new Promise((resolve, reject) => {
      const messageJson = JSON.stringify(request)
      const messageBuffer = Buffer.from(messageJson, 'utf-8')
      const lengthBuffer = Buffer.alloc(4)
      lengthBuffer.writeUInt32LE(messageBuffer.length, 0)

      const timer = setTimeout(() => {
        this.pendingRequests.delete(request.id)
        reject(new Error(`Request "${request.action}" timed out after ${NATIVE_MESSAGE_TIMEOUT_MS}ms`))
      }, NATIVE_MESSAGE_TIMEOUT_MS)

      this.pendingRequests.set(request.id, { resolve, reject, timer })

      // 写入 stdout，Chrome 扩展通过 Native Messaging 读取
      process.stdout.write(Buffer.concat([lengthBuffer, messageBuffer]))
    })
  }

  get connected(): boolean {
    return this.isConnected
  }
}
