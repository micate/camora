export function exportRules() {
  return chrome.storage.local.get('groups').then((result) => {
    return JSON.stringify({
      vendor: 'Camora',
      version: 1,
      groups: result.groups || [],
    }, null, 2);
  })
}
