import type { Rule, RuleGroup } from "../types";

/**
 * Cleanup groups
 * @param groups 
 * @param cleanRules 是否清理规则中的开关，默认不清理
 * @returns 
 */
export function cleanupGroups(groups: RuleGroup[], cleanRules = false) {
  return groups.map((group: RuleGroup) => {
    const newGroup = { ...group }
    if (cleanRules && Array.isArray(newGroup.rules)) {
      newGroup.rules = newGroup.rules.map((rule: Rule) => {
        const newRule = { ...rule }
        delete newRule.enabled;
        return newRule
      })
    }
    delete newGroup.enabled;
    return newGroup
  })
}
