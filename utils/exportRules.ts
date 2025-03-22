export function exportRules() {
  return chrome.storage.local.get('groups').then((result) => {
    const cleanedGroups = cleanupGroups(result.groups, true);
    return cleanedGroups;
  })
}
