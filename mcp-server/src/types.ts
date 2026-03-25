// 与 Chrome 扩展共享的类型定义（独立副本，避免依赖扩展构建产物）

export enum SourceType {
  REGEX_FILTER = 'regexFilter',
  URL_FILTER = 'urlFilter',
}

export enum TargetType {
  REGEX_SUBSTITUTION = 'regexSubstitution',
  URL = 'url',
}

export enum RuleType {
  Redirect = 'redirect',
  SourceMap = 'sourceMap',
  CORS = 'cors',
}

export interface BaseRule {
  id: string
  type: RuleType
  source: string
  sourceType?: SourceType
  enabled?: boolean
}

export interface RedirectRule extends BaseRule {
  target: string
  targetType?: TargetType
}

export interface SourceMapRule extends BaseRule {
  sourceMapUrl: string
}

export interface CorsRule extends BaseRule {
  allowOrigin?: string
  allowCredentials?: boolean
  allowMethods?: string
  allowHeaders?: string
  maxAge?: number
}

export type Rule = RedirectRule | SourceMapRule | CorsRule

export interface RuleGroup {
  id: string
  name: string
  rules: Rule[]
  enabled?: boolean
}

// Native Messaging 协议消息类型

export type NativeMessageAction =
  | 'listGroups'
  | 'createGroup'
  | 'deleteGroup'
  | 'toggleGroup'
  | 'createRule'
  | 'updateRule'
  | 'deleteRule'
  | 'toggleRule'

export interface NativeRequest {
  id: string
  action: NativeMessageAction
  payload?: Record<string, unknown>
}

export interface NativeResponse {
  id: string
  success: boolean
  data?: unknown
  error?: string
}
