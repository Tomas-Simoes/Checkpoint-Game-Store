import { formatPrice, formatRating } from "../../../utils/formatters.js";

export function GameCard({ game }) {
  const detailHref = `#/jogos/${encodeURIComponent(game.slug)}`;

  return (
    <article className="game-card">
      <div className={`game-cover ${game.cover}`} aria-hidden="true">
        <span className="cover-orbit" />
        <span className="cover-pixels" />
      </div>
      <div className="game-info">
        <div className="card-topline">
          <span>{game.release}</span>
          <strong>{game.badge}</strong>
        </div>
        <h3>
          <a href={detailHref}>{game.title}</a>
        </h3>
        <p>{game.tagline}</p>
        <div className="game-meta-row">
          <span>{game.category}</span>
          <span>{formatRating(game.rating)}/5</span>
        </div>
        <div className="game-bottom">
          <span className="game-price">{formatPrice(game.price)}</span>
          <a href={detailHref}>
            Detalhes
          </a>
        </div>
      </div>
    </article>
  );
}
