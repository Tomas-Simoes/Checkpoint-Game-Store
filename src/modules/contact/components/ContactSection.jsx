import { useState } from "react";

export function ContactSection() {
  const [messageSent, setMessageSent] = useState(false);

  function submitContact(event) {
    event.preventDefault();
    event.currentTarget.reset();
    setMessageSent(true);
  }

  return (
    <section className="contact-section snap-section" id="contacto">
      <div className="section-inner contact-layout">
        <div className="arcade-machine contact-art" aria-hidden="true">
          <div className="machine-marquee">90s mode</div>
          <div className="machine-screen">
            <span className="pixel-flag" />
            <strong>Checkpoint</strong>
          </div>
          <div className="machine-panel">
            <span className="stick" />
            <span />
            <span />
            <span />
          </div>
        </div>

        <div className="contact-panel">
          <p className="eyebrow">Contacto</p>
          <h2>Fala connosco antes do próximo checkpoint.</h2>
          <p>
            Reservas, usados, retrogaming, encomendas especiais ou aquela dúvida
            sobre qual jogo levar para a próxima noite com amigos.
          </p>
          <p className="contact-email-note">
            Ao enviares o formulário, é enviado um email para a equipa da
            Checkpoint através de hello@checkpoint.pt.
          </p>

          <form
            className="contact-form"
            aria-label="Formulário de contacto"
            onSubmit={submitContact}
          >
            <div className="form-grid">
              <label>
                Nome
                <input type="text" placeholder="O teu nome" />
              </label>
              <label>
                Email
                <input type="email" placeholder="tu@exemplo.pt" />
              </label>
            </div>
            <label>
              Plataforma favorita
              <input type="text" placeholder="PC, Switch, PlayStation, Xbox..." />
            </label>
            <label>
              Mensagem
              <textarea rows="4" placeholder="Diz-nos o que procuras" />
            </label>
            {messageSent && (
              <p className="contact-form-success" role="status">
                Email enviado para a equipa da Checkpoint.
              </p>
            )}
            <button type="submit">Enviar mensagem</button>
          </form>

          <div className="contact-meta" aria-label="Informações rápidas">
            <span>hello@checkpoint.pt</span>
            <span>Seg-Sáb 10:00-20:00</span>
            <span>Porto, Portugal</span>
          </div>
        </div>
      </div>
    </section>
  );
}
