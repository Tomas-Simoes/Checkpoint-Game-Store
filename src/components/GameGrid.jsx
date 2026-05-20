import { games } from "../data/games.js";
import { GameCard } from "./GameCard.jsx";

export function GameGrid() {
  return (
    <section className="catalog-section snap-section" id="catalogo">
      <div className="section-inner">
        <div className="section-heading">
          <p className="eyebrow">Virais recentes</p>
          <h2>Jogos com energia de meme</h2>
          <p>
            Uma montra com títulos reais que andaram a circular forte entre
            amigos, clips e sessões caóticas de co-op.
          </p>
        </div>

        <div className="game-grid">
          {games.map((game) => (
            <GameCard game={game} key={game.title} />
          ))}
        </div>
      </div>
    </section>
  );
}
