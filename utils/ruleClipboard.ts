import {
  CorsRule,
  RedirectRule,
  Rule,
  RuleType,
  SourceMapRule,
} from "../types";
import { createRule } from "./createRule";
import { determineFilterType, determineRedirectType } from "./determineInputType";

const INTERNAL_CLIPBOARD_KEY = "ruleClipboard";
const MAX_CLIPBOARD_LENGTH = 256 * 1024;

interface RuleClipboardEnvelope {
  vendor: "Camora";
  kind: "rule";
  version: 1;
  rules: Array<Record<string, unknown>>;
}

export interface CopyRuleResult {
  internal: boolean;
  system: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanRuleForClipboard(rule: Rule): Record<string, unknown> {
  const base = {
    type: rule.type || RuleType.Redirect,
    source: rule.source || "",
    enabled: rule.enabled !== false,
  };

  if (rule.type === RuleType.SourceMap) {
    return {
      ...base,
      sourceMapUrl: (rule as SourceMapRule).sourceMapUrl || "",
    };
  }

  if (rule.type === RuleType.CORS) {
    const corsRule = rule as CorsRule;
    return {
      ...base,
      ...(corsRule.allowOrigin !== undefined ? { allowOrigin: corsRule.allowOrigin } : {}),
      ...(corsRule.allowCredentials !== undefined ? { allowCredentials: corsRule.allowCredentials } : {}),
      ...(corsRule.allowMethods !== undefined ? { allowMethods: corsRule.allowMethods } : {}),
      ...(corsRule.allowHeaders !== undefined ? { allowHeaders: corsRule.allowHeaders } : {}),
      ...(corsRule.maxAge !== undefined ? { maxAge: corsRule.maxAge } : {}),
    };
  }

  return {
    ...base,
    target: (rule as RedirectRule).target || "",
  };
}

export function serializeRulesForClipboard(rules: Rule[]): string {
  const payload: RuleClipboardEnvelope = {
    vendor: "Camora",
    kind: "rule",
    version: 1,
    rules: rules.map(cleanRuleForClipboard),
  };
  return JSON.stringify(payload, null, 2);
}

function parseRule(value: unknown): Rule | null {
  if (!isRecord(value) || typeof value.source !== "string") {
    return null;
  }

  const enabled = typeof value.enabled === "boolean" ? value.enabled : true;
  const sourceType = determineFilterType(value.source).type;

  if (value.type === RuleType.SourceMap) {
    if (typeof value.sourceMapUrl !== "string") return null;
    const rule = createRule({ type: RuleType.SourceMap }) as SourceMapRule;
    return {
      ...rule,
      source: value.source,
      sourceType,
      sourceMapUrl: value.sourceMapUrl,
      enabled,
    };
  }

  if (value.type === RuleType.CORS) {
    const rule = createRule({ type: RuleType.CORS }) as CorsRule;
    return {
      ...rule,
      source: value.source,
      sourceType,
      enabled,
      ...(typeof value.allowOrigin === "string" ? { allowOrigin: value.allowOrigin } : {}),
      ...(typeof value.allowCredentials === "boolean" ? { allowCredentials: value.allowCredentials } : {}),
      ...(typeof value.allowMethods === "string" ? { allowMethods: value.allowMethods } : {}),
      ...(typeof value.allowHeaders === "string" ? { allowHeaders: value.allowHeaders } : {}),
      ...(typeof value.maxAge === "number" && Number.isFinite(value.maxAge) ? { maxAge: value.maxAge } : {}),
    };
  }

  if (value.type === RuleType.Redirect || value.type === undefined) {
    if (typeof value.target !== "string") return null;
    const rule = createRule({ type: RuleType.Redirect }) as RedirectRule;
    return {
      ...rule,
      source: value.source,
      sourceType,
      target: value.target,
      targetType: determineRedirectType(value.target).type,
      enabled,
    };
  }

  return null;
}

export function parseRulesFromClipboard(text: string): Rule[] {
  if (!text || text.length > MAX_CLIPBOARD_LENGTH) {
    return [];
  }

  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    return [];
  }

  if (
    !isRecord(payload)
    || payload.vendor !== "Camora"
    || payload.kind !== "rule"
    || payload.version !== 1
    || !Array.isArray(payload.rules)
    || payload.rules.length === 0
  ) {
    return [];
  }

  return payload.rules.map(parseRule).filter((rule): rule is Rule => Boolean(rule));
}

export async function saveInternalRuleClipboard(text: string): Promise<void> {
  await chrome.storage.session.set({
    [INTERNAL_CLIPBOARD_KEY]: {
      text,
      copiedAt: Date.now(),
    },
  });
}

export async function copyRulesToClipboard(rules: Rule[]): Promise<CopyRuleResult> {
  const text = serializeRulesForClipboard(rules);

  // Start the system clipboard write before awaiting anything so the call
  // stays inside the user's click activation window.
  let systemWrite: Promise<void>;
  try {
    systemWrite = navigator.clipboard?.writeText
      ? navigator.clipboard.writeText(text)
      : Promise.reject(new Error("Clipboard API is unavailable"));
  } catch (error) {
    systemWrite = Promise.reject(error);
  }
  const internalWrite = saveInternalRuleClipboard(text);
  const [system, internal] = await Promise.allSettled([systemWrite, internalWrite]);

  if (system.status === "rejected" && internal.status === "rejected") {
    throw system.reason || internal.reason;
  }

  return {
    system: system.status === "fulfilled",
    internal: internal.status === "fulfilled",
  };
}

export async function getInternalClipboardRules(): Promise<Rule[]> {
  const result = await chrome.storage.session.get(INTERNAL_CLIPBOARD_KEY);
  const entry = result[INTERNAL_CLIPBOARD_KEY];
  if (!isRecord(entry) || typeof entry.text !== "string") {
    return [];
  }
  return parseRulesFromClipboard(entry.text);
}
