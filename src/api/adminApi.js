import { apiClient } from "./apiClient.js";

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 10);
}

function toProductView(product) {
  return {
    category: product.categoryName,
    categoryId: product.categoryId,
    id: product.id,
    imageUrl: product.imageUrl,
    price: Number(product.price ?? 0),
    sku: slugify(product.name),
    sold: 0,
    status: product.active ? (product.stock > 0 ? "Ativo" : "Sem stock") : "Arquivado",
    stock: product.stock,
    title: product.name
  };
}

function toProductStatsView(product) {
  return {
    id: product.productId,
    revenue: Number(product.revenue ?? 0),
    sold: Number(product.unitsSold ?? 0),
    title: product.productName
  };
}

function toCustomerStatsView(customer) {
  return {
    customer: customer.customerName,
    email: customer.email,
    orders: Number(customer.totalOrders ?? 0),
    total: Number(customer.totalSpent ?? 0)
  };
}

function formatRevenuePeriod(period, groupBy) {
  if (!period) {
    return "";
  }

  if (groupBy === "month") {
    const [year, month] = period.split("-").map(Number);
    return new Intl.DateTimeFormat("pt-PT", {
      month: "long",
      year: "numeric"
    }).format(new Date(year, month - 1, 1));
  }

  if (groupBy === "week") {
    return period;
  }

  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(`${period}T12:00:00`));
}

function toRevenuePeriodView(bucket, groupBy) {
  return {
    label: formatRevenuePeriod(bucket.period, groupBy),
    orders: Number(bucket.orders ?? 0),
    total: Number(bucket.total ?? 0)
  };
}

function toSaleStatusLabel(status) {
  if (status === "DELIVERED") {
    return "Enviado";
  }

  if (status === "CANCELLED") {
    return "Cancelado";
  }

  return "Pendente";
}

function toSaleStatusValue(status) {
  if (status === "Enviado" || status === "Pago") {
    return "DELIVERED";
  }

  if (status === "Cancelado") {
    return "CANCELLED";
  }

  return "PENDING_DELIVERY";
}

function getSaleQuantity(sale) {
  return sale.items.reduce((total, item) => total + item.quantity, 0);
}

function getSaleProductTitle(sale) {
  return sale.items.map((item) => item.productName).join(", ");
}

function toSaleView(sale) {
  const firstItem = sale.items[0];

  return {
    customer: sale.customerName,
    customerId: sale.customerId,
    date: formatDate(sale.saleDate),
    delivery: sale.deliveryAddress,
    id: sale.id,
    invoiceId: sale.id,
    invoiceNumber: sale.invoiceNumber,
    paymentMethod: sale.paymentMethod,
    productId: firstItem?.productId,
    productTitle: getSaleProductTitle(sale),
    quantity: getSaleQuantity(sale),
    status: toSaleStatusLabel(sale.status),
    total: Number(sale.total ?? 0)
  };
}

function getPaymentStatus(status) {
  return status === "Enviado" ? "Pago na entrega" : "Por cobrar na entrega";
}

function toInvoiceView(sale) {
  return {
    customer: {
      email: "",
      name: sale.customer
    },
    delivery: sale.delivery,
    id: sale.id,
    issuedAt: sale.date ? `${sale.date}T12:00:00.000Z` : null,
    items: [
      {
        description: sale.productTitle,
        productId: sale.productId,
        quantity: sale.quantity,
        total: sale.total,
        unitPrice: sale.quantity > 0 ? sale.total / sale.quantity : sale.total
      }
    ],
    number: sale.invoiceNumber,
    paymentMethod: sale.paymentMethod,
    paymentStatus: getPaymentStatus(sale.status),
    saleId: sale.id,
    total: sale.total
  };
}

function toUserView(user) {
  return {
    activeSessions: 0,
    canDelete: user.role !== "ADMIN",
    createdAt: user.createdAt,
    email: user.email,
    id: user.id,
    isSeedUser: user.email === "admin@checkpoint.local",
    name: user.name,
    role: String(user.role ?? "").toLowerCase(),
    sessions: []
  };
}

async function getCategories(options = {}) {
  return apiClient.get("/categories", options);
}

async function getCategoryId(categoryName, options = {}) {
  const normalizedName = categoryName.trim();
  const categories = await getCategories(options);
  const existingCategory = categories.find(
    (category) => category.name.toLowerCase() === normalizedName.toLowerCase()
  );

  if (existingCategory) {
    return existingCategory.id;
  }

  const category = await apiClient.post(
    "/categories",
    {
      description: `${normalizedName} da loja Checkpoint.`,
      name: normalizedName
    },
    options
  );

  return category.id;
}

async function getProductPayload(product, options = {}, existingProduct = null) {
  const categoryId = await getCategoryId(product.category, options);
  const title = product.title.trim();

  return {
    active: product.status !== "Arquivado",
    categoryId,
    description: existingProduct?.description || `${title} disponivel na Checkpoint.`,
    imageUrl: existingProduct?.imageUrl || product.imageUrl || "",
    name: title,
    price: Number(product.price),
    stock: Number(product.stock)
  };
}

async function getBackendProduct(productId, options = {}) {
  return apiClient.get(`/products/${productId}`, options);
}

async function getSales(options = {}) {
  const sales = await apiClient.get("/sales", options);
  return sales.map(toSaleView);
}

async function getStats(revenuePeriod = "day", options = {}) {
  const groupBy = revenuePeriod.toUpperCase();

  const [topProducts, leastSoldProducts, bestClients, revenue] = await Promise.all([
    apiClient.get("/stats/products/top", {
      ...options,
      params: {
        limit: 5,
        ...options.params
      }
    }),
    apiClient.get("/stats/products/least", {
      ...options,
      params: {
        limit: 5,
        ...options.params
      }
    }),
    apiClient.get("/stats/customers/top", {
      ...options,
      params: {
        limit: 5,
        ...options.params
      }
    }),
    apiClient.get("/stats/revenue", {
      ...options,
      params: {
        groupBy,
        ...options.params
      }
    })
  ]);

  return {
    bestClients: bestClients.map(toCustomerStatsView),
    leastSoldProducts: leastSoldProducts.map(toProductStatsView),
    revenueByPeriod: revenue.buckets.map((bucket) =>
      toRevenuePeriodView(bucket, revenuePeriod)
    ),
    topSoldProducts: topProducts.map(toProductStatsView)
  };
}

export const adminApi = {
  async createProduct(product, options = {}) {
    const payload = await getProductPayload(product, options);
    const createdProduct = await apiClient.post("/products", payload, options);
    return toProductView(createdProduct);
  },

  deleteProduct(productId, options = {}) {
    return apiClient.delete(`/products/${productId}`, options);
  },

  async getProducts(options = {}) {
    const products = await apiClient.get("/products", {
      ...options,
      params: {
        includeInactive: true,
        ...options.params
      }
    });

    return products.map(toProductView);
  },

  getSales,

  getStats,

  async getUsers(options = {}) {
    const users = await apiClient.get("/customers", options);
    return users.map(toUserView);
  },

  async getInvoices(options = {}) {
    const sales = await getSales(options);
    return sales.map(toInvoiceView);
  },

  async getInvoice(invoiceId, options = {}) {
    const invoice = await apiClient.get(`/invoices/sales/${invoiceId}`, options);

    return {
      customer: {
        email: invoice.customerEmail,
        name: invoice.customerName
      },
      delivery: invoice.billingAddress,
      id: invoice.saleId,
      issuedAt: invoice.issuedAt,
      items: invoice.items.map((item) => ({
        description: item.productName,
        productId: item.productName,
        quantity: item.quantity,
        total: Number(item.lineTotal ?? 0),
        unitPrice: Number(item.unitPrice ?? 0)
      })),
      number: invoice.invoiceNumber,
      paymentMethod: invoice.paymentMethod,
      paymentStatus: "Por cobrar na entrega",
      saleId: invoice.saleId,
      total: Number(invoice.total ?? 0)
    };
  },

  deleteUser(userId, options = {}) {
    return apiClient.delete(`/customers/${userId}`, options);
  },

  revokeSession() {
    return Promise.resolve({ success: true });
  },

  revokeUserSessions() {
    return Promise.resolve({ success: true });
  },

  async updateProduct(productId, updates, options = {}) {
    const existingProduct = await getBackendProduct(productId, options);
    const payload = await getProductPayload(updates, options, existingProduct);
    const updatedProduct = await apiClient.put(`/products/${productId}`, payload, options);
    return toProductView(updatedProduct);
  },

  async updateProductStock(productId, stock, options = {}) {
    const existingProduct = await getBackendProduct(productId, options);
    const payload = {
      active: existingProduct.active,
      categoryId: existingProduct.categoryId,
      description: existingProduct.description,
      imageUrl: existingProduct.imageUrl,
      name: existingProduct.name,
      price: Number(existingProduct.price),
      stock
    };
    const updatedProduct = await apiClient.put(`/products/${productId}`, payload, options);
    return toProductView(updatedProduct);
  },

  async updateSaleStatus(saleId, status, options = {}) {
    const updatedSale = await apiClient.patch(
      `/sales/${saleId}/status`,
      {
        status: toSaleStatusValue(status)
      },
      options
    );

    return toSaleView(updatedSale);
  }
};
