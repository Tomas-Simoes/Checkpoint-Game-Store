import { useEffect, useState } from "react";
import { shopApi } from "../../../api/shopApi.js";
import { GameCard } from "../../catalog/index.js";
import { reportAppError } from "../../error/index.js";

export function FeaturedGames() {
  const [games, setGames] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const controller = new AbortController();

    shopApi
      .getFeaturedGames({ signal: controller.signal })
      .then((gamesResponse) => {
        setGames(gamesResponse);
        setStatus("success");
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setStatus("error");
          reportAppError(error, {
            actionHref: "#/",
            actionLabel: "Voltar ao início",
            message: "Não foi possível carregar os destaques da loja.",
            title: "Falha de rede"
          });
        }
      });

    return () => controller.abort();
  }, []);

  return (
    <section className="featured-section snap-section" id="destaques">
      <div className="section-inner">
        <div className="section-heading featured-heading">
          <div>
            <p className="eyebrow">Destaques</p>
            <h2>Jogos em destaque</h2>
            <p>
              Uma seleção curta para entrar rápido no que está a mexer na loja.
            </p>
          </div>
          <a className="button button-secondary" href="#/catalogo">
            Catálogo completo
          </a>
        </div>

        {status === "loading" && (
          <p className="catalog-status">A carregar destaques...</p>
        )}

        {status === "error" && (
          <p className="catalog-status">
            Não foi possível carregar os destaques neste momento.
          </p>
        )}

        {status === "success" && (
          <div className="game-grid">
            {games.map((game) => (
              <GameCard game={game} key={game.id} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
