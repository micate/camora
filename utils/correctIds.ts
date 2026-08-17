import type { Rule, RuleGroup } from "../types";
import { uniqueId } from "./uniqueId";

// 遍历每个分组和每个分组下的规则
// 1. 如果没有 group.id 或者 rule.id 则自动生成一个；
// 2. 如果有重复的 group.id 或者 rule.id 则重新生成 group.id 或者 rule.id 并替换；
export function correctIds(ruleGroups: RuleGroup[]): RuleGroup[] {
  if (Array.isArray(ruleGroups)) {
    const idMaps = new Set<string>();
    ruleGroups.forEach((group: RuleGroup) => {
      if (!group.id || idMaps.has(group.id)) {
        group.id = uniqueId('group');
      }
      idMaps.add(group.id);
      if (Array.isArray(group.rules)) {
        group.rules.forEach((rule: Rule) => {
          if (!rule.id || idMaps.has(rule.id)) {
            rule.id = uniqueId('rule');
          }
          idMaps.add(rule.id);
        });
      }
    });
    return ruleGroups;
  }
  return [];
}
