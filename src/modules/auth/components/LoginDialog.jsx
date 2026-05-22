import { useEffect } from "react";
import { AuthPanel } from "./AuthPanel.jsx";

export function LoginDialog({ onClose, open }) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  function handleBackdropMouseDown(event) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <div
      className="auth-backdrop"
      onMouseDown={handleBackdropMouseDown}
      role="presentation"
    >
      <section
        aria-labelledby="auth-dialog-title"
        aria-modal="true"
        className="auth-dialog"
        role="dialog"
      >
        <button
          aria-label="Fechar login"
          className="auth-close"
          onClick={onClose}
          type="button"
        >
          X
        </button>
        <AuthPanel onAuthenticated={onClose} titleId="auth-dialog-title" />
        <a className="auth-page-link" href="#/login" onClick={onClose}>
          Abrir página de login
        </a>
      </section>
    </div>
  );
}
