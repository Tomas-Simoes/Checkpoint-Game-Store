import { apiClient } from "./apiClient.js";
import {
  mockGetSession,
  mockLogin,
  mockLogout,
  mockRegister
} from "./mocks/authMock.js";

function buildAuthHeaders(token, headers) {
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers
  };
}

export const authApi = {
  getSession(options = {}) {
    const { headers, token, ...requestOptions } = options;

    return apiClient.get("/auth/session", {
      ...requestOptions,
      fallbackData: () => mockGetSession(token),
      headers: buildAuthHeaders(token, headers)
    });
  },

  login(credentials, options = {}) {
    return apiClient.post("/auth/login", credentials, {
      fallbackData: () => mockLogin(credentials),
      ...options
    });
  },

  logout(options = {}) {
    const { headers, token, ...requestOptions } = options;

    return apiClient.post("/auth/logout", undefined, {
      fallbackData: () => mockLogout(token),
      ...requestOptions,
      headers: buildAuthHeaders(token, headers)
    });
  },

  register(account, options = {}) {
    return apiClient.post("/auth/register", account, {
      fallbackData: () => mockRegister(account),
      ...options
    });
  }
};
