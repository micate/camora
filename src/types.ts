export interface Rule {
  id: string
  name: string
  source: string
  target: string
  enabled: boolean
}

export interface RuleGroup {
  id: string
  name: string
  rules: Rule[]
  enabled: boolean
}
