export enum SourceType {
  REGEX_FILTER = 'regexFilter',
  URL_FILTER = 'urlFilter',
}

export enum TargetType {
  REGEX_SUBSTITUTION = 'regexSubstitution',
  URL = 'url',
}

export interface Rule {
  id: string
  source: string
  sourceType?: SourceType
  target: string
  targetType?: TargetType
  enabled: boolean
}

export interface RuleGroup {
  id: string
  name: string
  rules: Rule[]
  enabled: boolean
}

export interface ISyncStatus {
  loading?: boolean
  success?: string
  error?: string
}