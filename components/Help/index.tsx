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
      label: '使用正则规则',
      children: (
        <div>
          匹配规则（注意以 ^ 开头）：
          <pre>^https://(dev.)?mycdn.com/my-project/([^/+])/(.*)</pre>
          转发规则（使用 \序号 引用捕获内容）：
          <pre>http://127.0.0.1:3000/\3</pre>
        </div>
      ),
    },
    {
      key: '2',
      label: '使用通配符规则',
      children: (
        <div>
          匹配规则：
          <div className="table-container">
            <table>
              <tbody>
                <tr>
                  <th><code dir="ltr" translate="no"><b>urlFilter</b></code></th>
                  <th>配对</th>
                  <th>不匹配</th>
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
          转发规则（无法引用匹配内容）：
          <pre>https://example.com/</pre>
        </div>
      ),
    },
    {
      key: '3',
      label: '使用静态规则',
      children: (
        <div>
          匹配规则：
          <pre>https://example1.com/</pre>
          转发规则：
          <pre>https://example2.com/</pre>
        </div>
      ),
    },
  ];

  return (
    <Drawer
      title="规则说明"
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
                更详细的规则说明请参考 Google Chrome 的官方文档：
                <a
                  href="https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest?#property-RuleCondition-urlFilter"
                  target="_blank"
                  rel="noreferrer"
                >
                  网址匹配
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
