import { useAuth } from "../authContext.js";
import { AuthPanel } from "./AuthPanel.jsx";

function getSafeNextHash(next, authenticatedUser) {
  if (!next || !/^\/(?!\/)[a-z0-9/-]+$/i.test(next)) {
    return null;
  }

  if (next === "/admin" && authenticatedUser?.role !== "admin") {
    return "#/catalogo";
  }

  return `#${next}`;
}

export function LoginPage({ next, redirect }) {
  const { isAuthenticated, logout, user } = useAuth();

  function getRedirectHash(authenticatedUser) {
    const nextHash = getSafeNextHash(next, authenticatedUser);

    if (nextHash) {
      return nextHash;
    }

    if (redirect === "admin" && authenticatedUser?.role === "admin") {
      return "#/admin";
    }

    return authenticatedUser?.role === "admin" ? "#/admin" : "#/catalogo";
  }

  function handleAuthenticated(session) {
    window.location.hash = getRedirectHash(session?.user);
  }

  return (
    <main className="login-page">
      <section className="section-inner login-layout">
        <div className="login-copy">
          <p className="eyebrow">Checkpoint ID</p>
          <h1>Conta</h1>
          <p>
            Entra para continuar a tua sessão na loja.
          </p>
          <div className="login-terminal" aria-hidden="true">
            <div className="login-terminal-top">Checkpoint</div>
            <div className="login-terminal-screen">
              <span />
              <strong>{isAuthenticated ? "ONLINE" : "READY"}</strong>
            </div>
          </div>
        </div>

        {isAuthenticated ? (
          <section
            className="auth-panel account-panel"
            aria-labelledby="account-title"
          >
            <div className="auth-panel-heading">
              <p className="eyebrow">Sessão ativa</p>
              <h2 id="account-title">{user?.name ?? "Conta"}</h2>
            </div>
            <dl className="account-summary">
              <div>
                <dt>Email</dt>
                <dd>{user?.email}</dd>
              </div>
              <div>
                <dt>Perfil</dt>
                <dd>{user?.role}</dd>
              </div>
            </dl>
            <div className="account-actions">
              <a className="button button-primary" href={getRedirectHash(user)}>
                {user?.role === "admin" ? "Ir para admin" : "Ver catálogo"}
              </a>
              <button
                className="auth-submit auth-submit-secondary"
                onClick={logout}
                type="button"
              >
                Sair
              </button>
            </div>
          </section>
        ) : (
          <AuthPanel onAuthenticated={handleAuthenticated} />
        )}
      </section>
    </main>
  );
}
