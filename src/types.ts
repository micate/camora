export interface Rule {
  id: string
  source: string
  sourceType?: 'regexFilter' | 'urlFilter'
  target: string
  targetType?: 'regexSubstitution' | 'url'
  enabled: boolean
}

export interface RuleGroup {
  id: string
  name: string
  rules: Rule[]
  enabled: boolean
}
