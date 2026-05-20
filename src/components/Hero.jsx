import { perks } from "../data/games.js";
import heroImage from "../assets/arcade-hero.png";

export function Hero() {
  return (
    <section className="hero snap-section" id="home">
      <img className="hero-bg" src={heroImage} alt="" aria-hidden="true" />
      <div className="hero-scanline" aria-hidden="true" />

      <div className="hero-inner">
        <div className="hero-copy">
          <p className="eyebrow">Loja de jogos, consolas e retrogaming</p>
          <h1>Checkpoint</h1>
          <p className="hero-lead">
            Encontra lançamentos, usados em ótimo estado e clássicos que ainda
            sabem a fichas, ecrãs CRT e noites de fliperama.
          </p>
          <div className="hero-actions" aria-label="Ações principais">
            <a className="button button-primary" href="#catalogo">
              Ver catálogo
            </a>
            <a className="button button-secondary" href="#contacto">
              Contactar loja
            </a>
          </div>
          <dl className="hero-stats">
            <div>
              <dt>500+</dt>
              <dd>jogos</dd>
            </div>
            <div>
              <dt>24h</dt>
              <dd>envio rápido</dd>
            </div>
            <div>
              <dt>90s</dt>
              <dd>energia retro</dd>
            </div>
          </dl>
          <div className="hero-perks" aria-label="Vantagens da loja">
            {perks.map((perk) => (
              <span key={perk}>{perk}</span>
            ))}
          </div>
        </div>

        <div className="arcade-preview" aria-hidden="true">
          <div className="cabinet-top">Checkpoint</div>
          <div className="cabinet-screen">
            <span className="screen-flag" />
          </div>
          <div className="cabinet-controls">
            <span className="joystick" />
            <span className="control-dot dot-pink" />
            <span className="control-dot dot-yellow" />
            <span className="control-dot dot-cyan" />
          </div>
        </div>
      </div>
    </section>
  );
}
