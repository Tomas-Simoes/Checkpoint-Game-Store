import { useAuth } from "../../auth/authContext.js";
import { BrandMark } from "./BrandMark.jsx";

const navItems = [
  { href: "#/catalogo", label: "Catálogo" },
  { href: "#contacto", label: "Contacto" }
];

export function Header() {
  const { isAuthenticated, isChecking, logout, user } = useAuth();
  const accountName = user?.name?.split(" ")[0] ?? "Conta";
  const visibleNavItems =
    user?.role === "admin"
      ? [...navItems, { href: "#/admin", label: "Admin" }]
      : navItems;

  return (
    <header className="site-header">
      <div className="header-inner">
        <BrandMark />
        <nav className="main-nav" aria-label="Navegação principal">
          {visibleNavItems.map((item) => (
            <a href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="header-auth">
          {isAuthenticated ? (
            <>
              <span className="header-user">{accountName}</span>
              <button
                className="header-auth-button header-auth-button-secondary"
                onClick={logout}
                type="button"
              >
                Sair
              </button>
            </>
          ) : (
            <a
              className="header-auth-button"
              aria-disabled={isChecking}
              href={isChecking ? undefined : "#/login"}
            >
              {isChecking ? "..." : "Entrar"}
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
