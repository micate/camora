import { RuleGroup } from "../types";

export function getRulesCount(groups: RuleGroup[]) {
  return groups.reduce((acc, group) => acc + (group.rules?.length || 0), 0);
}