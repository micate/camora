import { Drawer } from 'antd';

interface ISettingProps {
  visible: boolean;
  onToggleSetting: (visible: boolean) => void
}

export default function Setting(props: ISettingProps) {
  const { visible, onToggleSetting } = props;

  return (
    <Drawer
      title={false}
      closeIcon={false}
      placement="bottom"
      width="100vw"
      height="92vh"
      open={visible}
      onClose={() => {
        onToggleSetting(false);
      }}
    >
      <p>Some contents...</p>
      <p>Some contents...</p>
      <p>Some contents...</p>
    </Drawer>
  )
}