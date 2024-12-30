import { SettingOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Progress, Space } from 'antd';
import './index.less';

const conicColors = {
  '0%': '#87d068',
  '50%': '#ffe58f',
  '100%': '#ffccc7',
};

interface IFooterProps {
  rulesCount: number;
  regexRulesCount: number;
  onAddGroup: () => void;
}

export default function Footer(props: IFooterProps) {
  const { rulesCount, regexRulesCount, onAddGroup } = props;
  const { MAX_NUMBER_OF_DYNAMIC_RULES, MAX_NUMBER_OF_REGEX_RULES } = chrome.declarativeNetRequest;

  const rulesFormat = (percent?: number | undefined) => {
    return `${chrome.i18n.getMessage('dynamic_rules')} ${(percent || 0).toFixed(2)}% | ${rulesCount} / ${MAX_NUMBER_OF_DYNAMIC_RULES}`
  }

  const regexRulesFormat = (percent?: number | undefined) => {
    return `${chrome.i18n.getMessage('regex_rules')} ${(percent || 0).toFixed(2)}% | ${regexRulesCount} / ${MAX_NUMBER_OF_REGEX_RULES}`
  }

  return (
    <div className="app-footer">
      <div className="app-footer-left">
        <Button
          size="middle"
          type="text"
          shape="circle"
          icon={<SettingOutlined />}
        />
      </div>
      <div className="app-footer-center">
        <Button
          size="small"
          shape="circle"
          type="primary"
          icon={<PlusOutlined />}
          onClick={onAddGroup}
        />
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
              format={regexRulesFormat}
            />
          </Space>
        </div>
      </div>
    </div>
  );
}