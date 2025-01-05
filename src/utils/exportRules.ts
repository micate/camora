import { message } from 'antd';

export function exportRules() {
  chrome.storage.local.get('groups').then((result) => {
    if (result.groups) {
      message.success(chrome.i18n.getMessage('export_success'));
      const json = JSON.stringify({
        vendor: 'Camora',
        version: 1,
        groups: result.groups
      })
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'camora_groups.json'
      a.click()
      URL.revokeObjectURL(url)
    } else {
      message.warning(chrome.i18n.getMessage('export_content_empty'));
    }
  })
}
