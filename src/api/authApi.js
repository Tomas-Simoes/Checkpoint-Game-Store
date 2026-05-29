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

function normalizeRole(role) {
  return String(role ?? "").toLowerCase();
}

function normalizeUser(user) {
  if (!user) {
    return user;
  }

  return {
    ...user,
    role: normalizeRole(user.role)
  };
}

function getExpiresAt(session) {
  if (session.expiresAt) {
    return session.expiresAt;
  }

  if (!session.expiresInSeconds) {
    return undefined;
  }

  return new Date(Date.now() + session.expiresInSeconds * 1000).toISOString();
}

function normalizeSession(session) {
  if (!session) {
    return session;
  }

  if (session.token && session.user) {
    return {
      ...session,
      user: normalizeUser(session.user)
    };
  }

  return {
    expiresAt: getExpiresAt(session),
    token: session.accessToken,
    user: normalizeUser(session.customer)
  };
}

function normalizeRegisterPayload(account) {
  return {
    address: account.address.trim(),
    email: account.email.trim(),
    name: account.name.trim(),
    password: account.password,
    ...(account.phone?.trim() ? { phone: account.phone.trim() } : {})
  };
}

export const authApi = {
  getSession(options = {}) {
    const { headers, token, ...requestOptions } = options;

    return apiClient
      .get("/auth/session", {
        ...requestOptions,
        fallbackData: () => mockGetSession(token),
        headers: buildAuthHeaders(token, headers)
      })
      .then(normalizeSession);
  },

  login(credentials, options = {}) {
    return apiClient
      .post("/auth/login", credentials, {
        fallbackData: () => mockLogin(credentials),
        ...options
      })
      .then(normalizeSession);
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
    const payload = normalizeRegisterPayload(account);

    return apiClient
      .post("/auth/register", payload, {
        fallbackData: () => mockRegister(payload),
        ...options
      })
      .then(normalizeSession);
  }
};
