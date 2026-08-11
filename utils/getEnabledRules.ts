import { CorsRule, RedirectRule, Rule, RuleGroup, RuleType, SourceMapRule } from "../types";

function isCompleteRule(rule: Rule) {
  if (!rule.source) return false;

  switch (rule.type) {
    case RuleType.SourceMap:
      return Boolean((rule as SourceMapRule).sourceMapUrl);
    case RuleType.CORS: {
      const corsRule = rule as CorsRule;
      // Credentialed CORS requests require a concrete origin. A wildcard is
      // valid only for the default non-credentialed mode.
      return !corsRule.allowCredentials || Boolean(
        corsRule.allowOrigin && corsRule.allowOrigin !== '*'
      );
    }
    case RuleType.Redirect:
    default:
      return Boolean((rule as RedirectRule).target);
  }
}

export function getEnabledRules(ruleGroups: RuleGroup[]) {
  const enabledRules: Rule[] = [];
  if (Array.isArray(ruleGroups)) {
    for (const group of ruleGroups) {
      if (group.enabled) {
        for (const rule of group.rules) {
          if (rule.enabled && isCompleteRule(rule)) {
            enabledRules.push(rule);
          }
        }
      }
    }
  }
  return enabledRules;
}
