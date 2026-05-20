export function GameCard({ game }) {
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
        <h3>{game.title}</h3>
        <p>{game.tagline}</p>
        <div className="game-bottom">
          <span className="game-price">{game.genre}</span>
          <a href={game.url} target="_blank" rel="noreferrer">
            Ver jogo
          </a>
        </div>
      </div>
    </article>
  );
}
