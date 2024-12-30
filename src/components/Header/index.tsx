import { useEffect, useState } from "react";
import { Avatar, Switch } from "antd";
import Logo from "../../logo.png";
import "./index.less";

export default function Header() {
  const [enabled, setEnabled] = useState<boolean>(false);

  useEffect(() => {
    chrome.storage.local.get('enabled').then(({ enabled: savedEnabled }) => {
      setEnabled(savedEnabled);
    });
  }, []);

  const handleToggleRule = () => {
    const newEnabled = !enabled
    setEnabled(newEnabled);
    chrome.storage.local.set({ enabled: newEnabled });
  };

  return (
    <div className="app-header">
      <span className="app-header-main">
        <span className="app-header-logo">
          <Avatar size="small" src={Logo} alt="Camora" />
        </span>
        <span className="app-header-name">
          Camora
        </span>
      </span>
      <span className="app-header-actions">
        <Switch checked={enabled} onChange={handleToggleRule} />
      </span>
    </div>
  )
}
