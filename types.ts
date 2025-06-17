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
  allowOrigin?: string;
  allowCredentials?: boolean;
  allowMethods?: string;
  allowHeaders?: string;
  maxAge?: number;
}

export type Rule = RedirectRule | SourceMapRule | CorsRule;

export interface RuleGroup {
  id: string
  name: string
  rules: Rule[]
  enabled?: boolean
}

export interface ISyncStatus {
  loading?: boolean
  success?: string
  error?: string
}