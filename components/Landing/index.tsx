import Logo from '/icon/icon.png?url';
import './index.less';

interface ILandingProps {
  visible?: boolean;
}

export default function Landing(props: ILandingProps) {
  const { visible } = props

  return (
    <div className={`app-landing ${visible ? 'app-landing-visible' : 'app-landing-hidden'}`}>
      <div className="app-landing-content">
        <img className="app-landing-logo" src={Logo} alt="Camora" />
        <h1 className="app-landing-title">Camora</h1>
      </div>
    </div>
  )
}
