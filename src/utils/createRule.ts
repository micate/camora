import { Rule } from "@/types";
import { uniqueId } from "./uniqueId";

export function createRule(): Rule {
  return {
    id: uniqueId(),
    source: '',
    target: '',
    enabled: true,
  };
}
