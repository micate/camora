import {
  Rule,
  RuleGroup,
  RuleMutationResult,
  RedirectRule,
  RuleServiceCommand,
  RuleStoreSnapshot,
  RuleType,
  SourceType,
  SourceMapRule,
  TargetType,
} from '../types';
import { createGroup } from './createGroup';
import { createRule } from './createRule';
import { uniqueId } from './uniqueId';
import { updateDynamicRules } from './updateDynamicRules';

const REVISION_KEY = 'rulesRevision';
const AUDIT_KEY = 'ruleAuditLog';
const MAX_AUDIT_ENTRIES = 100;

type AuditEntry = {
  id: string;
  requestId?: string;
  action: string;
  requestSignature?: string;
  timestamp: string;
  before: RuleStoreSnapshot;
  after: RuleStoreSnapshot;
  dnrApplied: boolean;
};

export class RuleServiceError extends Error {
  constructor(public code: string, message: string, public details?: unknown) {
    super(message);
    this.name = 'RuleServiceError';
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function asString(value: unknown, field: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new RuleServiceError('INVALID_ARGUMENT', `${field} must be a non-empty string`);
  }
  return value.trim();
}

function validateRule(rule: Rule) {
  if (!Object.values(RuleType).includes(rule.type)) {
    throw new RuleServiceError('INVALID_RULE', `Unsupported rule type: ${rule.type}`);
  }
  asString(rule.source, 'source');
  if (rule.sourceType && !Object.values(SourceType).includes(rule.sourceType)) {
    throw new RuleServiceError('INVALID_RULE', `Unsupported sourceType: ${rule.sourceType}`);
  }
  if (rule.type === RuleType.Redirect) {
    const redirectRule = rule as RedirectRule;
    asString(redirectRule.target, 'target');
    if (redirectRule.targetType && !Object.values(TargetType).includes(redirectRule.targetType)) {
      throw new RuleServiceError('INVALID_RULE', `Unsupported targetType: ${redirectRule.targetType}`);
    }
  }
  if (rule.type === RuleType.SourceMap) {
    asString((rule as SourceMapRule).sourceMapUrl, 'sourceMapUrl');
  }
}

async function getSnapshot(): Promise<RuleStoreSnapshot> {
  const data = await chrome.storage.local.get(['enabled', 'groups', REVISION_KEY]);
  return {
    enabled: data.enabled === true,
    groups: Array.isArray(data.groups) ? data.groups : [],
    revision: Number.isInteger(data[REVISION_KEY]) ? data[REVISION_KEY] : 0,
  };
}

function findGroup(groups: RuleGroup[], groupId: string) {
  const group = groups.find((candidate) => candidate.id === groupId);
  if (!group) throw new RuleServiceError('GROUP_NOT_FOUND', `Rule group not found: ${groupId}`);
  return group;
}

function findRule(groups: RuleGroup[], ruleId: string) {
  for (const group of groups) {
    const rule = group.rules.find((candidate) => candidate.id === ruleId);
    if (rule) return { group, rule };
  }
  throw new RuleServiceError('RULE_NOT_FOUND', `Rule not found: ${ruleId}`);
}

function assertRevision(snapshot: RuleStoreSnapshot, expectedRevision: unknown) {
  if (!Number.isInteger(expectedRevision)) {
    throw new RuleServiceError('REVISION_REQUIRED', 'expectedRevision is required for write operations');
  }
  if (snapshot.revision !== expectedRevision) {
    throw new RuleServiceError(
      'REVISION_CONFLICT',
      `Expected revision ${expectedRevision}, current revision is ${snapshot.revision}`,
      { currentRevision: snapshot.revision },
    );
  }
}

async function appendAudit(entry: AuditEntry) {
  const data = await chrome.storage.local.get(AUDIT_KEY);
  const entries: AuditEntry[] = Array.isArray(data[AUDIT_KEY]) ? data[AUDIT_KEY] : [];
  await chrome.storage.local.set({ [AUDIT_KEY]: [...entries, entry].slice(-MAX_AUDIT_ENTRIES) });
}

function canonicalJson(value: unknown): string {
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

async function findIdempotentResult(command: RuleServiceCommand): Promise<RuleMutationResult | undefined> {
  if (!command.requestId) return undefined;
  const data = await chrome.storage.local.get(AUDIT_KEY);
  const entries: AuditEntry[] = Array.isArray(data[AUDIT_KEY]) ? data[AUDIT_KEY] : [];
  const entry = entries.find((candidate) => candidate.requestId === command.requestId);
  if (!entry) return undefined;
  if (entry.action !== command.action || entry.requestSignature !== canonicalJson(command)) {
    throw new RuleServiceError('REQUEST_ID_CONFLICT', 'requestId was already used for another request');
  }
  return {
    success: true,
    revision: entry.after.revision,
    before: entry.before,
    after: entry.after,
    dnrApplied: entry.dnrApplied,
    auditId: entry.id,
  };
}

let mutationQueue: Promise<unknown> = Promise.resolve();

function mutate(
  command: RuleServiceCommand,
  update: (draft: RuleStoreSnapshot) => void,
): Promise<RuleMutationResult> {
  const operation = async () => {
    const previousResult = await findIdempotentResult(command);
    if (previousResult) return previousResult;
    const before = await getSnapshot();
    assertRevision(before, command.expectedRevision);
    const after = clone(before);
    update(after);
    after.revision = before.revision + 1;

    await chrome.storage.local.set({
      enabled: after.enabled,
      groups: after.groups,
      [REVISION_KEY]: after.revision,
    });
    const dnrApplied = await updateDynamicRules(after.enabled ? after.groups : []);

    const auditId = uniqueId('audit');
    await appendAudit({
      id: auditId,
      requestId: command.requestId,
      action: command.action,
      requestSignature: canonicalJson(command),
      timestamp: new Date().toISOString(),
      before,
      after,
      dnrApplied,
    });
    return { success: true, revision: after.revision, before, after, dnrApplied, auditId } as const;
  };

  const result = mutationQueue.then(operation, operation);
  mutationQueue = result.catch(() => undefined);
  return result;
}

function buildRule(input: unknown): Rule {
  if (!input || typeof input !== 'object') {
    throw new RuleServiceError('INVALID_ARGUMENT', 'rule must be an object');
  }
  const data = input as Partial<Rule>;
  const rule = {
    ...createRule({ type: data.type || RuleType.Redirect }),
    ...data,
    id: uniqueId('rule'),
    enabled: data.enabled !== false,
  } as Rule;
  validateRule(rule);
  return rule;
}

export async function executeRuleCommand(command: RuleServiceCommand): Promise<unknown> {
  switch (command.action) {
    case 'app.get':
      return getSnapshot();
    case 'group.list': {
      const snapshot = await getSnapshot();
      return { revision: snapshot.revision, groups: snapshot.groups };
    }
    case 'group.get': {
      const snapshot = await getSnapshot();
      return { revision: snapshot.revision, group: findGroup(snapshot.groups, asString(command.groupId, 'groupId')) };
    }
    case 'rule.list': {
      const snapshot = await getSnapshot();
      const groupId = typeof command.groupId === 'string' ? command.groupId : undefined;
      const groups = groupId ? [findGroup(snapshot.groups, groupId)] : snapshot.groups;
      const rules = groups.flatMap((group) => group.rules.map((rule) => ({ ...rule, groupId: group.id, groupName: group.name })));
      return { revision: snapshot.revision, rules };
    }
    case 'rule.get': {
      const snapshot = await getSnapshot();
      const found = findRule(snapshot.groups, asString(command.ruleId, 'ruleId'));
      return { revision: snapshot.revision, groupId: found.group.id, rule: found.rule };
    }
    case 'rule.validate': {
      const rule = buildRule(command.rule);
      const { id: _id, ...validatedRule } = rule;
      return { valid: true, rule: validatedRule };
    }
    case 'app.setEnabled':
      return mutate(command, (draft) => { draft.enabled = command.enabled === true; });
    case 'group.create':
      return mutate(command, (draft) => {
        const group = createGroup(asString(command.name, 'name'));
        group.rules = [];
        draft.groups.push(group);
      });
    case 'group.update':
      return mutate(command, (draft) => {
        findGroup(draft.groups, asString(command.groupId, 'groupId')).name = asString(command.name, 'name');
      });
    case 'group.setEnabled':
      return mutate(command, (draft) => {
        findGroup(draft.groups, asString(command.groupId, 'groupId')).enabled = command.enabled === true;
      });
    case 'group.delete':
      if (command.confirm !== true) throw new RuleServiceError('CONFIRMATION_REQUIRED', 'Deleting a group requires confirm=true');
      return mutate(command, (draft) => {
        const groupId = asString(command.groupId, 'groupId');
        findGroup(draft.groups, groupId);
        draft.groups = draft.groups.filter((group) => group.id !== groupId);
      });
    case 'rule.create':
      return mutate(command, (draft) => {
        findGroup(draft.groups, asString(command.groupId, 'groupId')).rules.push(buildRule(command.rule));
      });
    case 'rule.update':
      return mutate(command, (draft) => {
        const found = findRule(draft.groups, asString(command.ruleId, 'ruleId'));
        if (!command.patch || typeof command.patch !== 'object') {
          throw new RuleServiceError('INVALID_ARGUMENT', 'patch must be an object');
        }
        const updated = { ...found.rule, ...(command.patch as Partial<Rule>), id: found.rule.id } as Rule;
        validateRule(updated);
        found.group.rules = found.group.rules.map((rule) => rule.id === updated.id ? updated : rule);
      });
    case 'rule.setEnabled':
      return mutate(command, (draft) => {
        findRule(draft.groups, asString(command.ruleId, 'ruleId')).rule.enabled = command.enabled === true;
      });
    case 'rule.delete':
      if (command.confirm !== true) throw new RuleServiceError('CONFIRMATION_REQUIRED', 'Deleting a rule requires confirm=true');
      return mutate(command, (draft) => {
        const found = findRule(draft.groups, asString(command.ruleId, 'ruleId'));
        found.group.rules = found.group.rules.filter((rule) => rule.id !== found.rule.id);
      });
    default:
      throw new RuleServiceError('UNKNOWN_ACTION', `Unknown action: ${command.action}`);
  }
}

export async function bumpRevisionForExternalGroupWrite(changes: { [key: string]: chrome.storage.StorageChange }) {
  if (!changes.groups || changes[REVISION_KEY]) return;
  const snapshot = await getSnapshot();
  await chrome.storage.local.set({ [REVISION_KEY]: snapshot.revision + 1 });
}
