import { useEffect, useState } from "react";
import { AdminPage } from "./modules/admin/index.js";
import { LoginPage } from "./modules/auth/index.js";
import { CatalogPage } from "./modules/catalog/index.js";
import { ContactSection } from "./modules/contact/index.js";
import { ErrorPage } from "./modules/error/index.js";
import { GameDetailPage } from "./modules/game-detail/index.js";
import { FeaturedGames, Hero } from "./modules/home/index.js";
import { Header } from "./modules/layout/index.js";

function getRouteFromHash() {
  if (window.location.hash === "#/erro") {
    return { name: "error" };
  }

  if (window.location.hash === "#/admin") {
    return { name: "admin" };
  }

  if (window.location.hash.startsWith("#/login")) {
    const [, queryString = ""] = window.location.hash.split("?");
    const params = new URLSearchParams(queryString);

    return {
      name: "login",
      next: params.get("next"),
      redirect: params.get("redirect")
    };
  }

  if (window.location.hash === "#/catalogo") {
    return { name: "catalog" };
  }

  const match = window.location.hash.match(/^#\/jogos\/([^/]+)$/);

  if (match) {
    return {
      name: "game",
      slug: decodeURIComponent(match[1])
    };
  }

  return { name: "home" };
}

export default function App() {
  const [route, setRoute] = useState(getRouteFromHash);

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(getRouteFromHash());
    };

    window.addEventListener("hashchange", handleHashChange);

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    if (route.name === "home" && window.location.hash) {
      const targetId = decodeURIComponent(window.location.hash.slice(1));
      const target = document.getElementById(targetId);

      if (target) {
        target.scrollIntoView();
      }
    }
  }, [route]);

  const isHomeRoute = route.name === "home";

  return (
    <div className={`app-shell${isHomeRoute ? "" : " app-shell-detail"}`}>
      <Header />
      {route.name === "game" ? (
        <GameDetailPage slug={route.slug} />
      ) : route.name === "error" ? (
        <ErrorPage />
      ) : route.name === "admin" ? (
        <AdminPage />
      ) : route.name === "login" ? (
        <LoginPage next={route.next} redirect={route.redirect} />
      ) : route.name === "catalog" ? (
        <CatalogPage />
      ) : (
        <main>
          <Hero />
          <FeaturedGames />
          <ContactSection />
        </main>
      )}
    </div>
  );
}
