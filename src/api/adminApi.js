import { apiClient } from "./apiClient.js";
import {
  mockCreateProduct,
  mockDeleteProduct,
  mockListProducts,
  mockListSales,
  mockUpdateProduct,
  mockUpdateProductStock,
  mockUpdateSaleStatus
} from "./mocks/adminMock.js";
import {
  mockDeleteUser,
  mockListUsers,
  mockRevokeSession,
  mockRevokeUserSessions
} from "./mocks/authMock.js";
import {
  mockGetInvoice,
  mockListInvoices
} from "./mocks/purchasesMock.js";

export const adminApi = {
  createProduct(product, options = {}) {
    return apiClient.post("/admin/products", product, {
      fallbackData: () => mockCreateProduct(product),
      ...options
    });
  },

  deleteProduct(productId, options = {}) {
    return apiClient.delete(`/admin/products/${productId}`, {
      fallbackData: () => mockDeleteProduct(productId),
      ...options
    });
  },

  getProducts(options = {}) {
    return apiClient.get("/admin/products", {
      fallbackData: mockListProducts,
      ...options
    });
  },

  getSales(options = {}) {
    return apiClient.get("/admin/sales", {
      fallbackData: mockListSales,
      ...options
    });
  },

  getUsers(options = {}) {
    return apiClient.get("/admin/users", {
      fallbackData: mockListUsers,
      ...options
    });
  },

  getInvoices(options = {}) {
    return apiClient.get("/admin/invoices", {
      fallbackData: mockListInvoices,
      ...options
    });
  },

  getInvoice(invoiceId, options = {}) {
    return apiClient.get(`/admin/invoices/${invoiceId}`, {
      fallbackData: () => mockGetInvoice(invoiceId),
      ...options
    });
  },

  deleteUser(userId, options = {}) {
    return apiClient.delete(`/admin/users/${userId}`, {
      fallbackData: () => mockDeleteUser(userId),
      ...options
    });
  },

  revokeSession(sessionId, options = {}) {
    return apiClient.post(`/admin/sessions/${sessionId}/revoke`, undefined, {
      fallbackData: () => mockRevokeSession(sessionId),
      ...options
    });
  },

  revokeUserSessions(userId, options = {}) {
    return apiClient.post(`/admin/users/${userId}/revoke-sessions`, undefined, {
      fallbackData: () => mockRevokeUserSessions(userId),
      ...options
    });
  },

  updateProduct(productId, updates, options = {}) {
    return apiClient.patch(`/admin/products/${productId}`, updates, {
      fallbackData: () => mockUpdateProduct(productId, updates),
      ...options
    });
  },

  updateProductStock(productId, stock, options = {}) {
    return apiClient.patch(`/admin/products/${productId}/stock`, { stock }, {
      fallbackData: () => mockUpdateProductStock(productId, stock),
      ...options
    });
  },

  updateSaleStatus(saleId, status, options = {}) {
    return apiClient.patch(`/admin/sales/${saleId}`, { status }, {
      fallbackData: () => mockUpdateSaleStatus(saleId, status),
      ...options
    });
  }
};
