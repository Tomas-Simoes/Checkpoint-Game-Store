import { getStoredAppError } from "../errorStore.js";

export function ErrorPage({ error }) {
  const appError = error ?? getStoredAppError();

  function reloadPage() {
    window.location.reload();
  }

  return (
    <main className="error-page">
      <section className="section-inner error-layout">
        <div className="error-copy">
          <p className="eyebrow">Erro</p>
          <h1>{appError.title}</h1>
          <p>{appError.message}</p>
          {appError.detail && <code>{appError.detail}</code>}
          <div className="error-actions">
            <button className="button button-primary" onClick={reloadPage} type="button">
              Tentar novamente
            </button>
            <a className="button button-secondary" href={appError.actionHref}>
              {appError.actionLabel}
            </a>
          </div>
        </div>

        <div className="error-screen" aria-hidden="true">
          <span>500</span>
          <strong>Offline?</strong>
        </div>
      </section>
    </main>
  );
}
