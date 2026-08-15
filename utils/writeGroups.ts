import type { RuleGroup } from '../types';

let writeQueue: Promise<number> = Promise.resolve(0);

export function writeGroups(groups: RuleGroup[]) {
  const write = async () => {
    const data = await chrome.storage.local.get('rulesRevision');
    const currentRevision = Number.isInteger(data.rulesRevision) ? data.rulesRevision : 0;
    const revision = currentRevision + 1;
    await chrome.storage.local.set({ groups, rulesRevision: revision });
    return revision;
  };
  writeQueue = writeQueue.then(write, write);
  return writeQueue;
}
