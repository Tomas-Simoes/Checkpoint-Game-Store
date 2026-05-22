import { useEffect, useState } from "react";
import { shopApi } from "../../../api/shopApi.js";
import { reportAppError } from "../../error/index.js";
import { formatPrice, formatRating } from "../../../utils/formatters.js";
import { PurchasePanel } from "./PurchasePanel.jsx";

function DetailStatus({ children }) {
  return (
    <main className="game-detail-page">
      <div className="section-inner">
        <p className="catalog-status">{children}</p>
      </div>
    </main>
  );
}

export function GameDetailPage({ slug }) {
  const [game, setGame] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const controller = new AbortController();

    setStatus("loading");
    setGame(null);

    shopApi
      .getGameBySlug(slug, { signal: controller.signal })
      .then((gameResponse) => {
        setGame(gameResponse);
        setStatus("success");
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setStatus("error");
          reportAppError(error, {
            actionHref: "#/catalogo",
            actionLabel: "Voltar ao catálogo",
            message: "Não foi possível carregar a página do jogo.",
            title: "Falha ao carregar jogo"
          });
        }
      });

    return () => controller.abort();
  }, [slug]);

  if (status === "loading") {
    return <DetailStatus>A carregar jogo...</DetailStatus>;
  }

  if (status === "error" || !game) {
    return (
      <main className="game-detail-page">
        <div className="section-inner">
          <a className="detail-back" href="#/catalogo">
            Voltar ao catálogo
          </a>
          <p className="catalog-status">Este jogo não foi encontrado.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="game-detail-page">
      <section className="section-inner detail-layout">
        <a className="detail-back" href="#/catalogo">
          Voltar ao catálogo
        </a>

        <div className="detail-cover-wrap">
          <div className={`game-cover detail-cover ${game.cover}`} aria-hidden="true">
            <span className="cover-orbit" />
            <span className="cover-pixels" />
          </div>
        </div>

        <div className="detail-copy">
          <div className="detail-topline">
            <span>{game.category}</span>
            <strong>{game.badge}</strong>
          </div>
          <h1>{game.title}</h1>
          <p className="detail-lead">{game.tagline}</p>
          <p className="detail-description">{game.description}</p>

          <div className="detail-stats" aria-label="Informação do jogo">
            <div>
              <span>Preço</span>
              <strong>{formatPrice(game.price)}</strong>
            </div>
            <div>
              <span>Avaliação</span>
              <strong>{formatRating(game.rating)}/5</strong>
            </div>
            <div>
              <span>Jogadores</span>
              <strong>{game.players}</strong>
            </div>
            <div>
              <span>Stock</span>
              <strong>{game.stock}</strong>
            </div>
          </div>

          <dl className="detail-specs">
            <div>
              <dt>Género</dt>
              <dd>{game.genre}</dd>
            </div>
            <div>
              <dt>Plataformas</dt>
              <dd>{game.platform}</dd>
            </div>
            <div>
              <dt>Lançamento</dt>
              <dd>{game.release}</dd>
            </div>
            <div>
              <dt>Modos</dt>
              <dd>{game.modes.join(", ")}</dd>
            </div>
          </dl>

          <div className="detail-tags" aria-label="Tags do jogo">
            {game.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>

          <div className="detail-actions">
            <a className="button button-primary" href={game.url} rel="noreferrer" target="_blank">
              Ver na Steam
            </a>
            <a className="button button-secondary" href="#/catalogo">
              Explorar catálogo
            </a>
          </div>

          <PurchasePanel game={game} />
        </div>
      </section>
    </main>
  );
}
