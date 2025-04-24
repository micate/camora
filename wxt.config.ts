import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    name: "Camora",
    version: "1.4.2",
    description: "__MSG_description__",
    permissions: [
      "alarms",
      "declarativeNetRequest",
      "storage"
    ],
    host_permissions: [
      "<all_urls>"
    ],
    default_locale: "en",
    icons: {
      "16": "icon/icon.png",
      "48": "icon/icon.png",
      "128": "icon/icon.png"
    }
  },
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-react'],
});