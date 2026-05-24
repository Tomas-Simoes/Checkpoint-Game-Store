import { useEffect, useState } from "react";
import { useAuth } from "../authContext.js";

const hasApiBaseUrl = Boolean(
  import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL
);
const loginForm = {
  email: hasApiBaseUrl ? "" : "player@checkpoint.pt",
  name: "",
  password: hasApiBaseUrl ? "" : "checkpoint123"
};
const registerForm = {
  address: "",
  email: "",
  name: "",
  password: ""
};
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateAuthForm(form, isRegisterMode) {
  const email = form.email.trim();
  const password = form.password;
  const name = form.name.trim();

  if (!emailPattern.test(email)) {
    return "Indica um email válido.";
  }

  if (password.length < 8) {
    return "A palavra-passe deve ter pelo menos 8 caracteres.";
  }

  if (isRegisterMode && name.length < 2) {
    return "Indica um nome com pelo menos 2 caracteres.";
  }

  if (isRegisterMode && !form.address.trim()) {
    return "Indica uma morada.";
  }

  return "";
}

export function AuthPanel({ onAuthenticated, titleId = "auth-panel-title" }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(loginForm);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegisterMode = mode === "register";
  const title = isRegisterMode ? "Criar conta" : "Entrar";

  useEffect(() => {
    setError("");
  }, [mode]);

  function updateField(field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setForm(nextMode === "login" ? loginForm : registerForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const validationError = validateAuthForm(form, isRegisterMode);

      if (validationError) {
        setError(validationError);
        return;
      }

      let session;

      if (isRegisterMode) {
        session = await register(form);
      } else {
        session = await login({
          email: form.email,
          password: form.password
        });
      }

      onAuthenticated?.(session);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-panel" aria-labelledby={titleId}>
      <div className="auth-panel-heading">
        <p className="eyebrow">Conta Checkpoint</p>
        <h2 id={titleId}>{title}</h2>
      </div>

      <div className="auth-segmented" aria-label="Modo de autenticação">
        <button
          className={mode === "login" ? "is-active" : undefined}
          onClick={() => changeMode("login")}
          type="button"
        >
          Entrar
        </button>
        <button
          className={mode === "register" ? "is-active" : undefined}
          onClick={() => changeMode("register")}
          type="button"
        >
          Criar conta
        </button>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {isRegisterMode && (
          <label>
            Nome
            <input
              autoComplete="name"
              autoFocus
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="O teu nome"
              required
              type="text"
              value={form.name}
            />
          </label>
        )}

        {isRegisterMode && (
          <label>
            Morada
            <input
              autoComplete="street-address"
              onChange={(event) => updateField("address", event.target.value)}
              placeholder="Rua, numero e localidade"
              required
              type="text"
              value={form.address}
            />
          </label>
        )}

        <label>
          Email
          <input
            autoComplete="username"
            autoFocus={!isRegisterMode}
            onChange={(event) => updateField("email", event.target.value)}
            placeholder="tu@exemplo.pt"
            required
            type="email"
            value={form.email}
          />
        </label>

        <label>
          Palavra-passe
          <input
            autoComplete={isRegisterMode ? "new-password" : "current-password"}
            minLength={8}
            onChange={(event) => updateField("password", event.target.value)}
            placeholder="8 caracteres ou mais"
            required
            type="password"
            value={form.password}
          />
        </label>

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        <button className="auth-submit" disabled={isSubmitting} type="submit">
          {isSubmitting ? "A validar..." : title}
        </button>
      </form>
    </section>
  );
}
