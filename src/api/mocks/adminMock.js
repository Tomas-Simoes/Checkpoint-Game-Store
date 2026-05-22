import { ApiError } from "../apiClient.js";
import { mockGames } from "./gamesMock.js";

const PRODUCTS_STORAGE_KEY = "checkpoint.admin.products";
const SALES_STORAGE_KEY = "checkpoint.admin.sales";
const productStatuses = ["Ativo", "Sem stock", "Arquivado"];
const saleStatuses = ["Pendente", "Pago", "Enviado", "Cancelado"];

const stockLevels = [12, 7, 18, 9, 24, 6, 4, 31, 15];
const soldLevels = [38, 21, 27, 44, 63, 19, 52, 76, 33];

const initialSales = [
  {
    customer: "Mariana Costa",
    date: "2026-05-18",
    id: "sale_1001",
    productId: "game_balatro",
    quantity: 2,
    status: "Pago"
  },
  {
    customer: "Mariana Costa",
    date: "2026-05-14",
    id: "sale_1004",
    productId: "game_stardew_valley",
    quantity: 1,
    status: "Enviado"
  },
  {
    customer: "Rui Almeida",
    date: "2026-05-12",
    id: "sale_1005",
    productId: "game_content_warning",
    quantity: 4,
    status: "Pago"
  },
  {
    customer: "Sofia Neves",
    date: "2026-05-07",
    id: "sale_1006",
    productId: "game_hades_ii",
    quantity: 1,
    status: "Enviado"
  },
  {
    customer: "Rui Almeida",
    date: "2026-04-28",
    id: "sale_1007",
    productId: "game_repo",
    quantity: 2,
    status: "Pago"
  },
  {
    customer: "Joao Pereira",
    date: "2026-04-18",
    id: "sale_1008",
    productId: "game_celeste",
    quantity: 1,
    status: "Pago"
  },
  {
    customer: "Sofia Neves",
    date: "2026-04-02",
    id: "sale_1009",
    productId: "game_elden_ring",
    quantity: 1,
    status: "Enviado"
  },
  {
    customer: "Mariana Costa",
    date: "2026-03-22",
    id: "sale_1010",
    productId: "game_peak",
    quantity: 2,
    status: "Pago"
  },
  {
    customer: "Tiago Ramos",
    date: "2026-05-19",
    id: "sale_1002",
    productId: "game_elden_ring",
    quantity: 1,
    status: "Enviado"
  },
  {
    customer: "Ines Martins",
    date: "2026-05-20",
    id: "sale_1003",
    productId: "game_peak",
    quantity: 3,
    status: "Pendente"
  }
];

function clone(data) {
  return JSON.parse(JSON.stringify(data));
}

function readStorage(key, fallbackData) {
  if (typeof window === "undefined") {
    return clone(fallbackData);
  }

  try {
    return JSON.parse(window.localStorage.getItem(key)) ?? clone(fallbackData);
  } catch {
    return clone(fallbackData);
  }
}

function writeStorage(key, data) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(data));
}

function createInitialProducts() {
  return mockGames.map((game, index) => ({
    category: game.category,
    cover: game.cover,
    id: game.id,
    price: game.price,
    sku: `CP-${String(index + 1).padStart(4, "0")}`,
    slug: game.slug,
    sold: soldLevels[index] ?? 0,
    status: stockLevels[index] > 0 ? "Ativo" : "Sem stock",
    stock: stockLevels[index] ?? 10,
    title: game.title
  }));
}

function getProducts() {
  return readStorage(PRODUCTS_STORAGE_KEY, createInitialProducts());
}

function saveProducts(products) {
  writeStorage(PRODUCTS_STORAGE_KEY, products);
}

function getSales() {
  return readStorage(SALES_STORAGE_KEY, initialSales);
}

function saveSales(sales) {
  writeStorage(SALES_STORAGE_KEY, sales);
}

function formatDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function getProductOrThrow(productId) {
  const product = getProducts().find((candidate) => candidate.id === productId);

  if (!product) {
    throw new ApiError("Produto não encontrado.", { status: 404 });
  }

  return product;
}

function buildSaleView(sale) {
  const product = getProducts().find((candidate) => candidate.id === sale.productId);

  return {
    ...sale,
    invoiceId: sale.invoiceId ?? null,
    invoiceNumber: sale.invoiceNumber ?? null,
    productTitle: product?.title ?? "Produto removido",
    total: (product?.price ?? 0) * sale.quantity
  };
}

function normalizeProductInput(product, currentProduct = {}) {
  const title = product?.title?.trim() || currentProduct.title;
  const sku = product?.sku?.trim() || currentProduct.sku || "";
  const category = product?.category?.trim() || currentProduct.category || "Indie";
  const price = Number(product?.price ?? currentProduct.price ?? 0);
  const stock = Number(product?.stock ?? currentProduct.stock ?? 0);
  const status = product?.status || currentProduct.status || "Ativo";

  if (!title || title.length < 2 || title.length > 80) {
    throw new ApiError("Nome do produto inválido.", { status: 400 });
  }

  if (sku && !/^[a-z0-9-]{2,24}$/i.test(sku)) {
    throw new ApiError("SKU inválido.", { status: 400 });
  }

  if (category.length < 2 || category.length > 40) {
    throw new ApiError("Categoria inválida.", { status: 400 });
  }

  if (!Number.isFinite(price) || price < 0 || price > 999.99) {
    throw new ApiError("Preço inválido.", { status: 400 });
  }

  if (!Number.isInteger(stock) || stock < 0 || stock > 9999) {
    throw new ApiError("Stock inválido.", { status: 400 });
  }

  if (!productStatuses.includes(status)) {
    throw new ApiError("Estado inválido.", { status: 400 });
  }

  return {
    category,
    price,
    sku,
    status,
    stock,
    title
  };
}

export function mockListProducts() {
  return getProducts();
}

export function mockCreateProduct(product) {
  const products = getProducts();
  const normalizedProduct = normalizeProductInput(product);

  const createdProduct = {
    ...normalizedProduct,
    cover: "cover-content",
    id: `product_${Date.now()}`,
    sku: normalizedProduct.sku || `CP-${Date.now().toString().slice(-4)}`,
    slug: normalizedProduct.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    sold: 0,
  };

  saveProducts([createdProduct, ...products]);

  return createdProduct;
}

export function mockUpdateProduct(productId, updates) {
  let updatedProduct = null;
  const products = getProducts().map((product) => {
    if (product.id !== productId) {
      return product;
    }

    updatedProduct = {
      ...product,
      ...normalizeProductInput(updates, product)
    };

    return updatedProduct;
  });

  if (!updatedProduct) {
    throw new ApiError("Produto não encontrado.", { status: 404 });
  }

  saveProducts(products);

  return updatedProduct;
}

export function mockDeleteProduct(productId) {
  const products = getProducts();
  const nextProducts = products.filter((product) => product.id !== productId);

  if (nextProducts.length === products.length) {
    throw new ApiError("Produto não encontrado.", { status: 404 });
  }

  saveProducts(nextProducts);

  return { success: true };
}

export function mockUpdateProductStock(productId, stock) {
  return mockUpdateProduct(productId, {
    ...getProductOrThrow(productId),
    stock
  });
}

export function mockListSales() {
  return getSales().map(buildSaleView);
}

export function mockUpdateSaleStatus(saleId, status) {
  if (!saleStatuses.includes(status)) {
    throw new ApiError("Estado da venda inválido.", { status: 400 });
  }

  let updatedSale = null;
  const sales = getSales().map((sale) => {
    if (sale.id !== saleId) {
      return sale;
    }

    updatedSale = {
      ...sale,
      status
    };

    return updatedSale;
  });

  if (!updatedSale) {
    throw new ApiError("Venda não encontrada.", { status: 404 });
  }

  saveSales(sales);

  return buildSaleView(updatedSale);
}

export function mockCreateSaleFromPurchase(purchase) {
  const productId = purchase?.productId;
  const quantity = Number(purchase?.quantity ?? 1);
  const customer = purchase?.customer?.trim();
  const status = purchase?.status ?? "Pendente";

  if (!customer || customer.length < 2 || customer.length > 80) {
    throw new ApiError("Cliente inválido.", { status: 400 });
  }

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 5) {
    throw new ApiError("Quantidade inválida.", { status: 400 });
  }

  if (!saleStatuses.includes(status)) {
    throw new ApiError("Estado da venda inválido.", { status: 400 });
  }

  const products = getProducts();
  const product = products.find((candidate) => candidate.id === productId);

  if (!product) {
    throw new ApiError("Produto não encontrado.", { status: 404 });
  }

  if (product.status === "Arquivado") {
    throw new ApiError("Produto indisponível.", { status: 409 });
  }

  if (product.stock < quantity) {
    throw new ApiError("Stock insuficiente.", {
      data: { message: "Não existe stock suficiente para esta compra." },
      status: 409
    });
  }

  const remainingStock = product.stock - quantity;
  const updatedProduct = {
    ...product,
    sold: product.sold + quantity,
    status: remainingStock === 0 ? "Sem stock" : product.status,
    stock: remainingStock
  };

  saveProducts(
    products.map((candidate) =>
      candidate.id === product.id ? updatedProduct : candidate
    )
  );

  const sale = {
    customer,
    customerEmail: purchase.customerEmail,
    customerId: purchase.customerId,
    date: formatDateKey(),
    delivery: purchase.delivery,
    id: `sale_${Date.now()}`,
    invoiceId: purchase.invoiceId,
    invoiceNumber: purchase.invoiceNumber,
    paymentMethod: "Pagamento no momento da entrega",
    productId,
    quantity,
    status
  };

  saveSales([sale, ...getSales()]);

  return buildSaleView(sale);
}
