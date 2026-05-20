import { BrandMark } from "./BrandMark.jsx";

const navItems = [
  { href: "#catalogo", label: "Catálogo" },
  { href: "#contacto", label: "Contacto" }
];

export function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <BrandMark />
        <nav className="main-nav" aria-label="Navegação principal">
          {navItems.map((item) => (
            <a href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <a className="header-cta" href="#catalogo">
          Entrar na loja
        </a>
      </div>
    </header>
  );
}
