import { PlusOutlined } from "@ant-design/icons";
import { Avatar, Button } from "antd";
import Logo from "../../logo.png";
import "./index.less";

interface ISidebarProps {
  onAddGroup: () => void;
}

export default function Header(props: ISidebarProps) {
  const { onAddGroup } = props;

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
        <Button
          size="small"
          shape="circle"
          icon={<PlusOutlined />}
          onClick={onAddGroup}
        />
      </span>
    </div>
  )
}
