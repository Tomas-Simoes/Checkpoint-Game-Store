const DEFAULT_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, "")}/api`
    : "");
const ENABLE_MOCK_FALLBACK =
  import.meta.env.VITE_ENABLE_MOCK_FALLBACK === "true";

let apiAuthToken = null;

export class ApiError extends Error {
  constructor(message, { status, data } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function normalizeBaseUrl(baseUrl) {
  return baseUrl.replace(/\/+$/, "");
}

function normalizePath(path) {
  return path.startsWith("/") ? path : `/${path}`;
}

function buildUrl(baseUrl, path, params) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const url = new URL(
    `${normalizedBaseUrl}${normalizePath(path)}`,
    window.location.origin
  );

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}

function cloneData(data) {
  if (data === undefined || data === null) {
    return data;
  }

  if (typeof structuredClone === "function") {
    return structuredClone(data);
  }

  return JSON.parse(JSON.stringify(data));
}

function hasFallback(fallbackData) {
  return fallbackData !== undefined;
}

async function resolveFallback(fallbackData, context) {
  const data =
    typeof fallbackData === "function"
      ? await fallbackData(context)
      : fallbackData;

  return cloneData(data);
}

function isAbortError(error) {
  return error?.name === "AbortError";
}

function shouldUseMockFallback(baseUrl) {
  return !baseUrl || ENABLE_MOCK_FALLBACK;
}

async function parseResponse(response) {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

function getApiErrorMessage(data) {
  if (data && typeof data === "object") {
    const fieldMessages = Object.values(data.fields ?? {}).filter(Boolean);

    if (fieldMessages.length > 0) {
      return fieldMessages.join(" ");
    }

    return (
      data.message ??
      data.error ??
      data.detail ??
      data.title ??
      "Pedido a API falhou."
    );
  }

  if (typeof data === "string" && data.trim()) {
    return data;
  }

  return "Pedido a API falhou.";
}

export function setApiAuthToken(token) {
  apiAuthToken = token;
}

export function createApiClient({ baseUrl = DEFAULT_API_BASE_URL } = {}) {
  async function request(path, options = {}) {
    const {
      body,
      fallbackData,
      headers,
      method = "GET",
      params,
      signal
    } = options;

    const requestContext = {
      authToken: apiAuthToken,
      body,
      method,
      params,
      path
    };

    if (!baseUrl && hasFallback(fallbackData)) {
      return resolveFallback(fallbackData, requestContext);
    }

    let response;
    let data;

    try {
      response = await fetch(buildUrl(baseUrl, path, params), {
        body: body === undefined ? undefined : JSON.stringify(body),
        headers: {
          Accept: "application/json",
          ...(body === undefined
            ? {}
            : { "Content-Type": "application/json" }),
          ...(apiAuthToken ? { Authorization: `Bearer ${apiAuthToken}` } : {}),
          ...headers
        },
        method,
        signal
      });

      data = await parseResponse(response);
    } catch (error) {
      if (
        isAbortError(error) ||
        !hasFallback(fallbackData) ||
        !shouldUseMockFallback(baseUrl)
      ) {
        throw error;
      }

      return resolveFallback(fallbackData, { ...requestContext, error });
    }

    if (!response.ok) {
      const error = new ApiError(getApiErrorMessage(data), {
        data,
        status: response.status
      });

      throw error;
    }

    return data;
  }

  return {
    delete: (path, options) => request(path, { ...options, method: "DELETE" }),
    get: (path, options) => request(path, { ...options, method: "GET" }),
    patch: (path, body, options) =>
      request(path, { ...options, body, method: "PATCH" }),
    post: (path, body, options) =>
      request(path, { ...options, body, method: "POST" }),
    put: (path, body, options) =>
      request(path, { ...options, body, method: "PUT" }),
    request
  };
}

export const apiClient = createApiClient();
