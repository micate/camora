import { Modal } from "antd";

export function importRules() {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json';
  fileInput.onchange = () => {
    const file = fileInput.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const data = JSON.parse(reader.result as string);

        if (data.vendor === 'Camora' && data.groups?.length) {
          Modal.confirm({
            title: chrome.i18n.getMessage('import_confirm_title', `${data.groups.length}`),
            content: chrome.i18n.getMessage('import_confirm_content'),
            onOk: () => {
              chrome.storage.local.set({ groups: data.groups });
              location.reload();
            },
          });
          return;
        }

        Modal.error({
          title: chrome.i18n.getMessage('import_error_title'),
          content: chrome.i18n.getMessage('import_error_content_empty'),
        });
      };
      reader.readAsText(file);
    }
  };
  fileInput.click();
}