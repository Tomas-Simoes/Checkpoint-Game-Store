import { ApiError } from "../apiClient.js";
import {
  mockCreateSaleFromPurchase,
  mockListSales
} from "./adminMock.js";
import { mockGetSession } from "./authMock.js";

const INVOICES_STORAGE_KEY = "checkpoint.shop.invoices";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const postalCodePattern = /^[0-9]{4}-[0-9]{3}$/;

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

function readInvoices() {
  return readStorage(INVOICES_STORAGE_KEY, []);
}

function writeInvoices(invoices) {
  writeStorage(INVOICES_STORAGE_KEY, invoices);
}

function normalizeText(value) {
  return value?.trim() ?? "";
}

function createKeySegment() {
  return Math.random().toString(36).slice(2, 7).toUpperCase();
}

function createGameKey(productTitle) {
  const prefix =
    productTitle
      ?.toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6) || "GAME";

  return `CP-${prefix}-${createKeySegment()}-${createKeySegment()}`;
}

function createInvoiceNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const suffix = `${now.getTime()}`.slice(-7);

  return `FT-${year}-${suffix}`;
}

function createSeedInvoiceNumber(sale) {
  const year = sale.date?.slice(0, 4) || new Date().getFullYear();
  const suffix = sale.id.replace(/\D/g, "").padStart(7, "0");

  return `FT-${year}-${suffix}`;
}

function getPaymentStatusFromSale(saleStatus) {
  return saleStatus === "Pago" || saleStatus === "Enviado"
    ? "Pago na entrega"
    : "Por cobrar na entrega";
}

function normalizePurchasePayload(payload, user) {
  const customer = payload?.customer ?? {};
  const delivery = payload?.delivery ?? {};
  const name = normalizeText(delivery.name || customer.name || user.name);
  const email = normalizeText(customer.email || user.email).toLowerCase();
  const phone = normalizeText(delivery.phone);
  const address = normalizeText(delivery.address);
  const postalCode = normalizeText(delivery.postalCode);
  const city = normalizeText(delivery.city);
  const quantity = Number(payload?.quantity ?? 1);

  if (!payload?.productId) {
    throw new ApiError("Produto inválido.", { status: 400 });
  }

  if (!name || name.length < 2 || name.length > 80) {
    throw new ApiError("Nome de entrega inválido.", { status: 400 });
  }

  if (!emailPattern.test(email)) {
    throw new ApiError("Email inválido.", { status: 400 });
  }

  if (phone.length < 6 || phone.length > 20) {
    throw new ApiError("Contacto telefónico inválido.", { status: 400 });
  }

  if (address.length < 6 || address.length > 140) {
    throw new ApiError("Morada inválida.", { status: 400 });
  }

  if (!postalCodePattern.test(postalCode)) {
    throw new ApiError("Código postal inválido.", {
      data: { message: "Usa o formato 0000-000." },
      status: 400
    });
  }

  if (city.length < 2 || city.length > 60) {
    throw new ApiError("Localidade inválida.", { status: 400 });
  }

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 5) {
    throw new ApiError("Quantidade inválida.", {
      data: { message: "A quantidade deve estar entre 1 e 5." },
      status: 400
    });
  }

  return {
    customer: {
      email,
      name
    },
    delivery: {
      address,
      city,
      name,
      phone,
      postalCode
    },
    productId: payload.productId,
    quantity
  };
}

export function mockPurchaseGame(payload, token) {
  if (!token) {
    throw new ApiError("Autenticação necessária.", {
      data: { message: "Entra na tua conta para concluir a compra." },
      status: 401
    });
  }

  const session = mockGetSession(token);
  const normalizedPurchase = normalizePurchasePayload(payload, session.user);
  const invoiceId = `invoice_${Date.now()}`;
  const invoiceNumber = createInvoiceNumber();
  const sale = mockCreateSaleFromPurchase({
    customer: normalizedPurchase.delivery.name,
    customerEmail: session.user.email,
    customerId: session.user.id,
    delivery: normalizedPurchase.delivery,
    invoiceId,
    invoiceNumber,
    productId: normalizedPurchase.productId,
    quantity: normalizedPurchase.quantity,
    status: "Pendente"
  });
  const unitPrice = sale.total / sale.quantity;
  const issuedAt = new Date().toISOString();
  const gameKeys = Array.from({ length: sale.quantity }, () =>
    createGameKey(sale.productTitle)
  );

  const invoice = {
    customer: {
      email: session.user.email,
      name: normalizedPurchase.customer.name
    },
    delivery: normalizedPurchase.delivery,
    id: invoiceId,
    issuedAt,
    items: [
      {
        description: sale.productTitle,
        productId: sale.productId,
        quantity: sale.quantity,
        total: sale.total,
        unitPrice
      }
    ],
    number: invoiceNumber,
    paymentMethod: "Pagamento no momento da entrega",
    paymentStatus: "Por cobrar na entrega",
    saleId: sale.id,
    total: sale.total
  };

  writeInvoices([invoice, ...readInvoices()]);

  return {
    gameKey: gameKeys[0],
    gameKeys,
    invoice,
    sale
  };
}

export function mockListInvoices() {
  const storedInvoices = readInvoices();
  const sales = mockListSales();
  const salesById = new Map(sales.map((sale) => [sale.id, sale]));
  const normalizedStoredInvoices = storedInvoices.map((invoice) => {
    const sale = salesById.get(invoice.saleId);

    if (!sale) {
      return invoice;
    }

    return {
      ...invoice,
      paymentStatus: getPaymentStatusFromSale(sale.status)
    };
  });
  const storedSaleIds = new Set(
    normalizedStoredInvoices.map((invoice) => invoice.saleId).filter(Boolean)
  );
  const seedInvoices = sales
    .filter((sale) => !storedSaleIds.has(sale.id))
    .map((sale) => {
      const issuedAt = `${sale.date}T12:00:00.000Z`;
      const unitPrice = sale.quantity > 0 ? sale.total / sale.quantity : sale.total;

      return {
        customer: {
          email: sale.customerEmail ?? "",
          name: sale.customer
        },
        delivery: sale.delivery ?? null,
        id: sale.invoiceId ?? `invoice_${sale.id}`,
        issuedAt,
        items: [
          {
            description: sale.productTitle,
            productId: sale.productId,
            quantity: sale.quantity,
            total: sale.total,
            unitPrice
          }
        ],
        number: sale.invoiceNumber ?? createSeedInvoiceNumber(sale),
        paymentMethod: sale.paymentMethod ?? "Pagamento no momento da entrega",
        paymentStatus: getPaymentStatusFromSale(sale.status),
        saleId: sale.id,
        total: sale.total
      };
    });

  return [...normalizedStoredInvoices, ...seedInvoices];
}

export function mockGetInvoice(invoiceId) {
  const invoice = mockListInvoices().find(
    (candidate) => candidate.id === invoiceId
  );

  if (!invoice) {
    throw new ApiError("Fatura não encontrada.", { status: 404 });
  }

  return invoice;
}
