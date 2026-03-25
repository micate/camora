/**
 * 生成唯一 ID，与扩展侧 utils/uniqueId.ts 保持一致的格式
 */
export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}
