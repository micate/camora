import { SettingOutlined, PlusOutlined } from '@ant-design/icons';
import { green, yellow, red } from '@ant-design/colors';
import { Button, Progress, Space, Tooltip } from 'antd';
import './index.less';

interface IFooterProps {
  rulesCount: number;
  regexRulesCount: number;
  onAddGroup: () => void;
  onToggleSetting: (visible: boolean) => void;
}

const conicColors = {
  '0%': green[5],
  '50%': yellow[5],
  '100%': red[5],
};

export default function Footer(props: IFooterProps) {
  const { rulesCount, regexRulesCount, onAddGroup, onToggleSetting } = props;
  const { MAX_NUMBER_OF_DYNAMIC_RULES, MAX_NUMBER_OF_REGEX_RULES } = chrome.declarativeNetRequest as any;

  const rulesFormat = (percent?: number | undefined) => {
    return `${chrome.i18n.getMessage('dynamic_rules')} ${Math.max(percent || 0, 1).toFixed(0)}% | ${rulesCount} / ${MAX_NUMBER_OF_DYNAMIC_RULES}`
  }

  const regexRulesFormat = (percent?: number | undefined) => {
    return `${chrome.i18n.getMessage('regex_rules')} ${Math.max(percent || 0, 1).toFixed(0)}% | ${regexRulesCount} / ${MAX_NUMBER_OF_REGEX_RULES}`
  }

  return (
    <div className="app-footer">
      <div className="app-footer-left">
        <Button
          size="middle"
          type="text"
          shape="circle"
          icon={<SettingOutlined />}
          onClick={() => onToggleSetting(true)}
        />
      </div>
      <div className="app-footer-center">
        <Tooltip title={chrome.i18n.getMessage('add_group')} placement="top">
          <Button
            size="small"
            shape="circle"
            type="primary"
            icon={<PlusOutlined />}
            onClick={onAddGroup}
          />
        </Tooltip>
      </div>
      <div className="app-footer-right">
        <div className="app-usage">
          <Space size="small" direction="horizontal">
            <Progress
              type="circle"
              size={16}
              percent={(rulesCount / MAX_NUMBER_OF_DYNAMIC_RULES) * 100}
              strokeColor={conicColors}
              format={rulesFormat}
            />
            <Progress
              type="circle"
              size={14}
              percent={(regexRulesCount / MAX_NUMBER_OF_REGEX_RULES) * 100}
              strokeColor={conicColors}
              trailColor="#f0f0f0"
              format={regexRulesFormat}
            />
          </Space>
        </div>
      </div>
    </div>
  );
}