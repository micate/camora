import Logo from '/icon/icon.png?url';
import './index.less';

interface ILandingProps {
  open?: boolean;
}

export default function Landing(props: ILandingProps) {
  const { open } = props

  return (
    <div className={`app-landing ${open ? 'app-landing-visible' : 'app-landing-hidden'}`}>
      <div className="app-landing-content">
        <img className="app-landing-logo" src={Logo} alt="Camora" />
        <h1 className="app-landing-title">Camora</h1>
      </div>
    </div>
  )
}
