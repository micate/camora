import { Rule, RuleGroup } from "@/types";

export function getEnabledRules(ruleGroups: RuleGroup[]) {
  const enabledRules: Rule[] = [];
  for (const group of ruleGroups) {
    if (group.enabled) {
      for (const rule of group.rules) {
        if (rule.enabled && rule.source && rule.target) {
          enabledRules.push(rule);
        }
      }
    }
  }
  return enabledRules;
}
