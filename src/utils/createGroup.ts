import { RuleGroup } from "@/types";
import { createRule } from "./createRule";
import { uniqueId } from "./uniqueId";

export function createGroup(name: string): RuleGroup {
  return {
    id: uniqueId('group'),
    name,
    rules: [createRule()],
    enabled: true
  };
}