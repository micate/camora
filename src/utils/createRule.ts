import { Rule } from "@/types";
import { uniqueId } from "./uniqueId";

export function createRule(data?: Partial<Rule>): Rule {
  return {
    ...(data || {}),
    id: uniqueId('rule'),
    source: '',
    enabled: true,
  } as any;
}
