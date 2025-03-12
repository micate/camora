import { RedirectRule, Rule, RuleGroup, SourceMapRule } from "@/types";

export function getEnabledRules(ruleGroups: RuleGroup[]) {
  const enabledRules: Rule[] = [];
  if (Array.isArray(ruleGroups)) {
    for (const group of ruleGroups) {
      if (group.enabled) {
        for (const rule of group.rules) {
          if (rule.enabled && rule.source && ((rule as RedirectRule).target || (rule as SourceMapRule).sourceMapUrl)) {
            enabledRules.push(rule);
          }
        }
      }
    }
  }
  return enabledRules;
}
