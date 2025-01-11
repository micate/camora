import { useEffect } from "react";
import { Modal } from "antd";
import { hashMessage } from "../utils/hashMessage";
import { cleanupGroups } from "../utils/cleanupGroups";

export function useSyncCheck() {
  useEffect(() => {
    const sync = async () => {
      const [local, sync] = await Promise.all([
        chrome.storage.local.get('groups'),
        chrome.storage.sync.get('groups'), 
      ]);

      if (!sync.groups?.length) {
        return;
      }

      const localGroupString = JSON.stringify(cleanupGroups(local.groups));
      const syncGroupString = JSON.stringify(cleanupGroups(sync.groups));
      if (localGroupString === syncGroupString) {
        return;
      }

      const syncGroupHash = await hashMessage(syncGroupString);
      chrome.storage.local.get('ignoredSync').then(({ ignoredSync }) => {
        if (ignoredSync === syncGroupHash) {
          return;
        }

        Modal.confirm({
          title: chrome.i18n.getMessage('sync_confirm_title'),
          content: chrome.i18n.getMessage('sync_confirm_content', [`${sync.groups.length}`, `${local.groups.length}`]),
          onOk: () => {
            chrome.storage.local.set({
              groups: sync.groups,
              activeGroupId: sync.groups[0].id,
              syncStatus: { success: new Date().toLocaleString() }
            });
            location.reload();
          },
          onCancel: () => {
            chrome.storage.local.set({
              ignoredSync: syncGroupHash,
            });
          }
        });
      })
    }
    sync()
  }, []);
}
