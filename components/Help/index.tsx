import { Alert, Collapse, Drawer, Space } from "antd";
import './index.less';

interface IHelpProps {
  visible?: boolean;
  onClose?: () => void;
}

export default function Help(props: IHelpProps) {
  const { visible, onClose } = props;

  const handleClose = () => {
    onClose?.();
  }

  const items = [
    {
      key: '1',
      label: chrome.i18n.getMessage('rule_help_regex_title'),
      children: (
        <div>
          {chrome.i18n.getMessage('rule_help_regex_match_title')}
          <pre>^https://(dev.)?mycdn.com/my-project/([^/+])/(.*)</pre>
          {chrome.i18n.getMessage('rule_help_regex_forward_title')}
          <pre>http://127.0.0.1:3000/\3</pre>
        </div>
      ),
    },
    {
      key: '2',
      label: chrome.i18n.getMessage('rule_help_wildcard_title'),
      children: (
        <div>
          {chrome.i18n.getMessage('rule_help_wildcard_match_title')}
          <div className="table-container">
            <table>
              <tbody>
                <tr>
                  <th><code dir="ltr" translate="no"><b>urlFilter</b></code></th>
                  <th>{chrome.i18n.getMessage('rule_help_wildcard_match_ok')}</th>
                  <th>{chrome.i18n.getMessage('rule_help_wildcard_match_not_ok')}</th>
                </tr>
                <tr>
                  <td><code dir="ltr" translate="no">"abc"</code></td>
                  <td>https://abcd.com<br />https://example.com/abcd</td>
                  <td>https://ab.com</td>
                </tr>
                <tr>
                  <td><code dir="ltr" translate="no">"abc*d"</code></td>
                  <td>https://abcd.com<br />https://example.com/abcxyzd</td>
                  <td>https://abc.com</td>
                </tr>
                <tr>
                  <td><code dir="ltr" translate="no">"||a.example.com"</code></td>
                  <td>https://a.example.com/<br />https://b.a.example.com/xyz<br />https://a.example.company</td>
                  <td>https://example.com/</td>
                </tr>
                <tr>
                  <td><code dir="ltr" translate="no">"|https*"</code></td>
                  <td>https://example.com</td>
                  <td>http://example.com/<br />http://https.com</td>
                </tr>
                <tr>
                  <td><code dir="ltr" translate="no">"example*^123|"</code></td>
                  <td>https://example.com/123<br />http://abc.com/example?123</td>
                  <td>https://example.com/1234<br />https://abc.com/example0123</td>
                </tr>
              </tbody>
            </table>
          </div>
          {chrome.i18n.getMessage('rule_help_wildcard_forward_title')}
          <pre>https://example.com/</pre>
        </div>
      ),
    },
    {
      key: '3',
      label: chrome.i18n.getMessage('rule_help_static_title'),
      children: (
        <div>
          {chrome.i18n.getMessage('rule_help_static_match_title')}
          <pre>https://example1.com/</pre>
          {chrome.i18n.getMessage('rule_help_static_forward_title')}
          <pre>https://example2.com/</pre>
        </div>
      ),
    },
  ];

  return (
    <Drawer
      title={chrome.i18n.getMessage('rule_help_title')}
      open={visible}
      placement="bottom"
      height="calc(100vh - 30px)"
      onClose={handleClose}
    >
      <div className="app-help-content">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Alert
            message={(
              <span>
                {chrome.i18n.getMessage('rule_help_tip_1')}
                <a
                  href="https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest?#property-RuleCondition-urlFilter"
                  target="_blank"
                  rel="noreferrer"
                >
                  {chrome.i18n.getMessage('rule_help_tip_2')}
                </a>
              </span>
            )}
            type="info"
            showIcon
          />
          <Collapse accordion items={items} defaultActiveKey={['1']} />
        </Space>
      </div>
    </Drawer>
  );
}
