import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    manifest_version: 3,
    name: "Camora",
    version: "1.4.0",
    description: "__MSG_description__",
    permissions: [
      "storage",
      "declarativeNetRequest"
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