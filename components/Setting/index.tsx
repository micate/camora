import { useEffect, useState } from "react";
import {
  CloudSyncOutlined,
  CodeOutlined,
  ExperimentOutlined,
  GlobalOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Form, Modal, Switch } from "antd";
import "./index.less";

interface ISettingProps {
  open: boolean;
  onClose: () => void;
}

interface SettingRowProps {
  description: string;
  icon: React.ReactNode;
  name: string;
  title: string;
}

function SettingRow({ description, icon, name, title }: SettingRowProps) {
  return (
    <div className="app-setting-row">
      <div className="app-setting-row-icon" aria-hidden="true">
        {icon}
      </div>
      <div className="app-setting-row-copy">
        <div className="app-setting-row-title">{title}</div>
        <div className="app-setting-row-description">{description}</div>
      </div>
      <Form.Item name={name} valuePropName="checked" noStyle>
        <Switch aria-label={title} />
      </Form.Item>
    </div>
  );
}

export default function Setting(props: ISettingProps) {
  const { open, onClose } = props;
  const [currentTab, setCurrentTab] = useState("common");
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      chrome.storage.local.get(
        ["enableSourceMap", "enableCors", "enableBackup"],
        ({ enableSourceMap, enableCors, enableBackup }) => {
          form.setFieldsValue({
            enableSourceMap: Boolean(enableSourceMap),
            enableCors: Boolean(enableCors),
            enableBackup: Boolean(enableBackup),
          });
        },
      );
    }
  }, [form, open]);

  const handleFormChange = (values: Record<string, boolean>) => {
    const { enableSourceMap, enableCors, enableBackup } = values || {};
    if (enableSourceMap !== undefined) {
      chrome.storage.local.set({ enableSourceMap });
    }
    if (enableCors !== undefined) {
      chrome.storage.local.set({ enableCors });
    }
    if (enableBackup !== undefined) {
      chrome.storage.local.set({ enableBackup });
      if (enableBackup) {
        chrome.runtime.sendMessage({ action: "doBackup" });
      }
    }
  };

  return (
    <Modal
      className="app-setting-modal"
      title={null}
      open={open}
      centered
      onCancel={onClose}
      footer={null}
      width={660}
    >
      <div className="app-setting-shell">
        <aside className="app-setting-sidebar">
          <div className="app-setting-nav-label">
            {chrome.i18n.getMessage("settings_category")}
          </div>
          <nav className="app-setting-nav" aria-label={chrome.i18n.getMessage("settings")}>
            <button
              type="button"
              className={`app-setting-nav-item ${currentTab === "common" ? "is-active" : ""}`}
              onClick={() => setCurrentTab("common")}
            >
              <SettingOutlined />
              <span>{chrome.i18n.getMessage("common")}</span>
            </button>
            <button
              type="button"
              className={`app-setting-nav-item ${currentTab === "advanced" ? "is-active" : ""}`}
              onClick={() => setCurrentTab("advanced")}
            >
              <ExperimentOutlined />
              <span>{chrome.i18n.getMessage("advanced")}</span>
              <span className="app-setting-nav-badge">Beta</span>
            </button>
          </nav>
        </aside>

        <main className="app-setting-main">
          {currentTab === "common" ? (
            <section className="app-setting-section">
              <h3>{chrome.i18n.getMessage("rule_features")}</h3>
              <Form
                form={form}
                layout="vertical"
                onValuesChange={handleFormChange}
                className="app-setting-card"
              >
                <div className="app-setting-card-body">
                  <SettingRow
                    name="enableSourceMap"
                    icon={<CodeOutlined />}
                    title={chrome.i18n.getMessage("enable_source_map")}
                    description={chrome.i18n.getMessage("enable_source_map_description")}
                  />
                  <SettingRow
                    name="enableCors"
                    icon={<GlobalOutlined />}
                    title={chrome.i18n.getMessage("enable_cors")}
                    description={chrome.i18n.getMessage("enable_cors_description")}
                  />
                  <SettingRow
                    name="enableBackup"
                    icon={<CloudSyncOutlined />}
                    title={chrome.i18n.getMessage("enable_backup")}
                    description={chrome.i18n.getMessage("enable_backup_description")}
                  />
                </div>
              </Form>
            </section>
          ) : (
            <div className="app-setting-empty">
              <ExperimentOutlined />
              <strong>{chrome.i18n.getMessage("coming_soon")}</strong>
              <span>{chrome.i18n.getMessage("settings_advanced_empty")}</span>
            </div>
          )}
        </main>
      </div>
    </Modal>
  );
}
