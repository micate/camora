import { CorsRule, Rule, RuleType } from "../types";
import {
  DEFAULT_CORS_ALLOW_HEADERS,
  DEFAULT_CORS_ALLOW_METHODS,
  DEFAULT_CORS_ALLOW_ORIGIN,
  DEFAULT_CORS_MAX_AGE,
} from './corsDefaults';
import { uniqueId } from "./uniqueId";

export function createRule(data?: Partial<Rule>): Rule {
  const corsDefaults = data?.type === RuleType.CORS
    ? {
        allowOrigin: (data as Partial<CorsRule>).allowOrigin ?? DEFAULT_CORS_ALLOW_ORIGIN,
        allowMethods: (data as Partial<CorsRule>).allowMethods ?? DEFAULT_CORS_ALLOW_METHODS,
        allowHeaders: (data as Partial<CorsRule>).allowHeaders ?? DEFAULT_CORS_ALLOW_HEADERS,
        maxAge: (data as Partial<CorsRule>).maxAge ?? DEFAULT_CORS_MAX_AGE,
      }
    : {};

  return {
    ...(data || {}),
    ...corsDefaults,
    id: uniqueId('rule'),
    source: '',
    enabled: true,
  } as any;
}
