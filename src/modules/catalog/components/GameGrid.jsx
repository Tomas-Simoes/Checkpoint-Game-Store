import { useEffect, useMemo, useState } from "react";
import { shopApi } from "../../../api/shopApi.js";
import { reportAppError } from "../../error/index.js";
import { GameCard } from "./GameCard.jsx";

const ALL_CATEGORIES = "Todos";

export function GameGrid() {
  const [games, setGames] = useState([]);
  const [maxPrice, setMaxPrice] = useState(null);
  const [minRating, setMinRating] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);
  const [sortBy, setSortBy] = useState("featured");
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const controller = new AbortController();

    shopApi
      .getGames({ signal: controller.signal })
      .then((gamesResponse) => {
        setGames(gamesResponse);
        setStatus("success");
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setStatus("error");
          reportAppError(error, {
            actionHref: "#/catalogo",
            actionLabel: "Voltar ao catálogo",
            message: "Não foi possível carregar o catálogo.",
            title: "Falha de rede"
          });
        }
      });

    return () => controller.abort();
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = new Set(games.map((game) => game.category));

    return [ALL_CATEGORIES, ...uniqueCategories];
  }, [games]);

  const catalogMaxPrice = useMemo(() => {
    if (games.length === 0) {
      return 0;
    }

    return Math.ceil(Math.max(...games.map((game) => game.price)));
  }, [games]);

  const effectiveMaxPrice = maxPrice ?? catalogMaxPrice;

  const filteredGames = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return games
      .filter((game) => {
        const matchesCategory =
          selectedCategory === ALL_CATEGORIES ||
          game.category === selectedCategory;
        const matchesPrice = game.price <= effectiveMaxPrice;
        const matchesRating = game.rating >= minRating;
        const matchesSearch =
          !normalizedSearch ||
          [game.title, game.genre, game.category, game.platform, ...game.tags]
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearch);

        return (
          matchesCategory && matchesPrice && matchesRating && matchesSearch
        );
      })
      .sort((firstGame, secondGame) => {
        if (sortBy === "price-asc") {
          return firstGame.price - secondGame.price;
        }

        if (sortBy === "price-desc") {
          return secondGame.price - firstGame.price;
        }

        if (sortBy === "rating-desc") {
          return secondGame.rating - firstGame.rating;
        }

        if (sortBy === "title") {
          return firstGame.title.localeCompare(secondGame.title);
        }

        return 0;
      });
  }, [
    effectiveMaxPrice,
    games,
    minRating,
    searchTerm,
    selectedCategory,
    sortBy
  ]);

  return (
    <section className="catalog-section snap-section" id="catalogo">
      <div className="section-inner">
        <div className="section-heading">
          <p className="eyebrow">Catálogo</p>
          <h2>Catálogo completo</h2>
          <p>
            Filtra por categoria, preço e avaliação para encontrares o jogo
            certo para a próxima sessão.
          </p>
        </div>

        {status === "loading" && (
          <p className="catalog-status">A carregar catálogo...</p>
        )}

        {status === "error" && (
          <p className="catalog-status">
            Não foi possível carregar o catálogo neste momento.
          </p>
        )}

        {status === "success" && (
          <>
            <div className="catalog-controls">
              <div className="category-tabs" aria-label="Categorias de jogos">
                {categories.map((category) => (
                  <button
                    className={
                      category === selectedCategory ? "is-active" : undefined
                    }
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    type="button"
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="filter-grid">
                <label className="filter-field">
                  Pesquisa
                  <input
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Nome, género, tag..."
                    type="search"
                    value={searchTerm}
                  />
                </label>

                <label className="filter-field">
                  <span>Preço máx. {effectiveMaxPrice}€</span>
                  <input
                    max={catalogMaxPrice}
                    min="0"
                    onChange={(event) => setMaxPrice(Number(event.target.value))}
                    step="1"
                    type="range"
                    value={effectiveMaxPrice}
                  />
                </label>

                <label className="filter-field">
                  Avaliação mínima
                  <select
                    onChange={(event) => setMinRating(Number(event.target.value))}
                    value={minRating}
                  >
                    <option value="0">Todas</option>
                    <option value="4">4.0+</option>
                    <option value="4.5">4.5+</option>
                    <option value="4.8">4.8+</option>
                  </select>
                </label>

                <label className="filter-field">
                  Ordenar
                  <select
                    onChange={(event) => setSortBy(event.target.value)}
                    value={sortBy}
                  >
                    <option value="featured">Destaques</option>
                    <option value="rating-desc">Melhor avaliação</option>
                    <option value="price-asc">Preço: baixo-alto</option>
                    <option value="price-desc">Preço: alto-baixo</option>
                    <option value="title">A-Z</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="catalog-summary">
              <strong>{filteredGames.length}</strong>
              <span>{filteredGames.length === 1 ? "jogo" : "jogos"}</span>
            </div>

            {filteredGames.length > 0 ? (
              <div className="game-grid">
                {filteredGames.map((game) => (
                  <GameCard game={game} key={game.id} />
                ))}
              </div>
            ) : (
              <p className="catalog-status">
                Não há jogos para esses filtros.
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
