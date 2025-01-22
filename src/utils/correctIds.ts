import { RuleGroup } from "../types";
import { uniqueId } from "./uniqueId";

// 遍历每个分组和每个分组下的规则
// 1. 如果没有 groupId 或者 ruleId 则自动生成一个；
// 2. 如果有重复的 groupId 或者 ruleId 则重新生成 groupId 或者 ruleId 并替换；
export function correctIds(ruleGroups: RuleGroup[]): RuleGroup[] {
  if (Array.isArray(ruleGroups)) {
    const idMaps = new Set<boolean>();
    ruleGroups.forEach((group: any) => {
      if (!group.groupId || idMaps.has(group.groupId)) {
        group.groupId = uniqueId('group');
      }
      idMaps.add(group.groupId);
      if (Array.isArray(group.rules)) {
        group.rules.forEach((rule: any) => {
          if (!rule.ruleId || idMaps.has(rule.ruleId)) {
            rule.ruleId = uniqueId('rule');
          }
          idMaps.add(rule.ruleId);
        });
      }
    });
    return ruleGroups;
  }
  return [];
}