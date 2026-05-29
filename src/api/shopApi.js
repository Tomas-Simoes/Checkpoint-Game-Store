import { ApiError, apiClient } from "./apiClient.js";
import { mockPerks } from "./mocks/perksMock.js";

const fallbackRatings = [4.7, 4.5, 4.6, 4.4, 4.8];

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isImageUrl(value) {
  return /^(https?:)?\/\//i.test(value) || value?.startsWith("/") || value?.startsWith("data:image/");
}

function getCoverClass(imageUrl) {
  if (!imageUrl || isImageUrl(imageUrl)) {
    return "cover-default";
  }

  return /^[a-z0-9_-]+$/i.test(imageUrl) ? imageUrl : "cover-default";
}

function formatProductDate(value) {
  if (!value) {
    return "Em loja";
  }

  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function toGame(product, index = 0) {
  const stock = Number(product.stock ?? 0);
  const category = product.categoryName ?? "Produto";
  const slug = slugify(product.name);

  return {
    badge: stock > 0 ? "Disponivel" : "Esgotado",
    category,
    cover: getCoverClass(product.imageUrl),
    description: product.description,
    genre: category,
    id: product.id,
    imageUrl: isImageUrl(product.imageUrl) ? product.imageUrl : "",
    modes: ["Loja online", "Entrega"],
    platform: category.toLowerCase().includes("acessor")
      ? "PC / Consola"
      : "PC / PlayStation / Xbox / Switch",
    players: "1+",
    price: Number(product.price ?? 0),
    rating: fallbackRatings[index % fallbackRatings.length],
    release: formatProductDate(product.createdAt),
    slug,
    stock: stock > 0 ? `${stock} em stock` : "Esgotado",
    tagline: product.description,
    tags: [category, stock > 0 ? "Em stock" : "Esgotado"],
    title: product.name,
    url: `https://store.steampowered.com/search/?term=${encodeURIComponent(product.name)}`
  };
}

function toDeliveryAddress(purchase) {
  const delivery = purchase.delivery ?? {};

  return [
    delivery.name,
    delivery.phone,
    delivery.address,
    delivery.postalCode,
    delivery.city
  ]
    .filter(Boolean)
    .join(", ");
}

function getPaymentStatus(status) {
  if (status === "DELIVERED") {
    return "Pago na entrega";
  }

  if (status === "CANCELLED") {
    return "Cancelado";
  }

  return "Por cobrar na entrega";
}

function toInvoiceItem(item) {
  return {
    description: item.productName,
    productId: item.productId,
    quantity: item.quantity,
    total: Number(item.lineTotal ?? 0),
    unitPrice: Number(item.unitPrice ?? 0)
  };
}

function toPurchaseResult(sale, purchase) {
  const items = sale.items.map(toInvoiceItem);

  return {
    gameKey: `CP-${sale.id}-${Date.now().toString(36).toUpperCase()}`,
    gameKeys: [],
    invoice: {
      customer: {
        email: purchase.customer?.email ?? "",
        name: sale.customerName
      },
      delivery: purchase.delivery ?? null,
      id: sale.invoiceNumber,
      issuedAt: sale.invoiceIssuedAt ?? sale.saleDate,
      items,
      number: sale.invoiceNumber,
      paymentMethod: sale.paymentMethod,
      paymentStatus: getPaymentStatus(sale.status),
      saleId: sale.id,
      total: Number(sale.total ?? 0)
    },
    sale
  };
}

async function getProductGames(options = {}) {
  const products = await apiClient.get("/products", options);
  return products.map(toGame);
}

export const shopApi = {
  async getFeaturedGames(options) {
    const games = await getProductGames(options);
    return games.slice(0, 4);
  },

  async getGameBySlug(slug, options) {
    const games = await getProductGames(options);
    const game = games.find((candidate) => candidate.slug === slug);

    if (!game) {
      throw new ApiError("Jogo nao encontrado.", { status: 404 });
    }

    return game;
  },

  getGames(options) {
    return getProductGames(options);
  },

  getPerks() {
    return Promise.resolve([...mockPerks]);
  },

  async purchaseGame(productId, purchase, options = {}) {
    const sale = await apiClient.post(
      "/sales",
      {
        deliveryAddress: toDeliveryAddress(purchase),
        items: [
          {
            productId,
            quantity: purchase.quantity
          }
        ]
      },
      options
    );

    return toPurchaseResult(sale, purchase);
  }
};
