import { apiClient } from "./apiClient.js";
import {
  mockGames,
  mockGetFeaturedGames,
  mockGetGameBySlug
} from "./mocks/gamesMock.js";
import { mockPerks } from "./mocks/perksMock.js";
import { mockPurchaseGame } from "./mocks/purchasesMock.js";

export const shopApi = {
  getFeaturedGames(options) {
    return apiClient.get("/shop/games/featured", {
      fallbackData: mockGetFeaturedGames,
      ...options
    });
  },

  getGameBySlug(slug, options) {
    return apiClient.get(`/shop/games/${slug}`, {
      fallbackData: () => mockGetGameBySlug(slug),
      ...options
    });
  },

  getGames(options) {
    return apiClient.get("/shop/games", {
      fallbackData: mockGames,
      ...options
    });
  },

  getPerks(options) {
    return apiClient.get("/shop/perks", {
      fallbackData: mockPerks,
      ...options
    });
  },

  purchaseGame(productId, purchase, options = {}) {
    return apiClient.post(
      "/shop/purchases",
      {
        ...purchase,
        productId
      },
      {
        fallbackData: ({ authToken, body }) => mockPurchaseGame(body, authToken),
        ...options
      }
    );
  }
};
