import { ApiError } from "../apiClient.js";

const MOCK_USERS_STORAGE_KEY = "checkpoint.auth.mockUsers";
const MOCK_DELETED_USERS_STORAGE_KEY = "checkpoint.auth.deletedUsers";
const MOCK_SESSIONS_STORAGE_KEY = "checkpoint.auth.sessions";
const TOKEN_TTL_SECONDS = 60 * 60 * 6;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const defaultMockUsers = [
  {
    email: "player@checkpoint.pt",
    id: "usr_player_one",
    name: "Player One",
    password: "checkpoint123",
    role: "customer",
    seedUser: true
  },
  {
    email: "admin@checkpoint.pt",
    id: "usr_admin_one",
    name: "Admin Checkpoint",
    password: "admin123",
    role: "admin",
    seedUser: true
  }
];

function readStorage(key, fallbackData) {
  if (typeof window === "undefined") {
    return fallbackData;
  }

  try {
    return JSON.parse(window.localStorage.getItem(key)) ?? fallbackData;
  } catch {
    return fallbackData;
  }
}

function writeStorage(key, data) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(data));
}

function readStoredUsers() {
  return readStorage(MOCK_USERS_STORAGE_KEY, []);
}

function writeStoredUsers(users) {
  writeStorage(MOCK_USERS_STORAGE_KEY, users);
}

function readDeletedUserIds() {
  return readStorage(MOCK_DELETED_USERS_STORAGE_KEY, []);
}

function writeDeletedUserIds(userIds) {
  writeStorage(MOCK_DELETED_USERS_STORAGE_KEY, userIds);
}

function readStoredSessions() {
  return readStorage(MOCK_SESSIONS_STORAGE_KEY, []);
}

function writeStoredSessions(sessions) {
  writeStorage(MOCK_SESSIONS_STORAGE_KEY, sessions);
}

function getMockUsers() {
  const deletedUserIds = new Set(readDeletedUserIds());

  return [
    ...defaultMockUsers.filter((user) => !deletedUserIds.has(user.id)),
    ...readStoredUsers()
  ];
}

function toPublicUser(user) {
  return {
    email: user.email,
    id: user.id,
    name: user.name,
    role: user.role
  };
}

function createSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function base64UrlEncode(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");

  return window
    .btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(value) {
  const paddedValue = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (paddedValue.length % 4)) % 4);
  const binary = window.atob(`${paddedValue}${padding}`);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));

  return JSON.parse(new TextDecoder().decode(bytes));
}

function createMockJwt(user, sessionId) {
  const now = Math.floor(Date.now() / 1000);
  const publicUser = toPublicUser(user);
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    ...publicUser,
    exp: now + TOKEN_TTL_SECONDS,
    iat: now,
    sid: sessionId,
    sub: publicUser.id
  };

  return [
    base64UrlEncode(header),
    base64UrlEncode(payload),
    base64UrlEncode({ signature: "checkpoint-dev-token" })
  ].join(".");
}

function decodeMockJwt(token) {
  const [, payload] = token?.split(".") ?? [];

  if (!payload) {
    throw new ApiError("Sessão inválida.", { status: 401 });
  }

  return base64UrlDecode(payload);
}

function createSession(user) {
  const sessionId = createSessionId();
  const token = createMockJwt(user, sessionId);
  const payload = decodeMockJwt(token);
  const now = new Date(payload.iat * 1000).toISOString();
  const expiresAt = new Date(payload.exp * 1000).toISOString();

  writeStoredSessions([
    {
      createdAt: now,
      expiresAt,
      id: sessionId,
      lastSeenAt: now,
      revokedAt: null,
      role: user.role,
      userEmail: user.email,
      userId: user.id,
      userName: user.name
    },
    ...readStoredSessions()
  ]);

  return {
    expiresAt,
    token,
    user: toPublicUser(user)
  };
}

function normalizeEmail(email) {
  return email?.trim().toLowerCase();
}

export function mockLogin(credentials) {
  const email = normalizeEmail(credentials?.email);
  const password = credentials?.password ?? "";
  const user = getMockUsers().find((candidate) => candidate.email === email);

  if (!user || user.password !== password) {
    throw new ApiError("Credenciais inválidas.", {
      data: { message: "Email ou palavra-passe inválidos." },
      status: 401
    });
  }

  return createSession(user);
}

export function mockRegister(account) {
  const email = normalizeEmail(account?.email);
  const name = account?.name?.trim();
  const password = account?.password ?? "";
  const storedUsers = readStoredUsers();
  const userExists = getMockUsers().some((user) => user.email === email);

  if (!emailPattern.test(email) || !name || password.length < 6) {
    throw new ApiError("Dados de conta inválidos.", {
      data: { message: "Preenche nome, email e uma palavra-passe válida." },
      status: 400
    });
  }

  if (userExists) {
    throw new ApiError("Conta já existe.", {
      data: { message: "Já existe uma conta com este email." },
      status: 409
    });
  }

  const user = {
    createdAt: new Date().toISOString(),
    email,
    id: `usr_${Date.now()}`,
    name,
    password,
    role: "customer"
  };

  writeStoredUsers([...storedUsers, user]);

  return createSession(user);
}

export function mockGetSession(token) {
  const payload = decodeMockJwt(token);

  if (payload.exp * 1000 <= Date.now()) {
    throw new ApiError("Sessão expirada.", { status: 401 });
  }

  const sessions = readStoredSessions();
  const session = sessions.find((candidate) => candidate.id === payload.sid);

  if (!session || session.revokedAt) {
    throw new ApiError("Sessão terminada.", { status: 401 });
  }

  const user = getMockUsers().find((candidate) => candidate.id === payload.sub);

  if (!user) {
    throw new ApiError("Utilizador removido.", { status: 401 });
  }

  writeStoredSessions(
    sessions.map((candidate) =>
      candidate.id === session.id
        ? { ...candidate, lastSeenAt: new Date().toISOString() }
        : candidate
    )
  );

  return {
    expiresAt: new Date(payload.exp * 1000).toISOString(),
    token,
    user: toPublicUser(user)
  };
}

export function mockLogout(token) {
  if (token) {
    const payload = decodeMockJwt(token);
    const now = new Date().toISOString();

    writeStoredSessions(
      readStoredSessions().map((session) =>
        session.id === payload.sid ? { ...session, revokedAt: now } : session
      )
    );
  }

  return { success: true };
}

function isSessionActive(session) {
  return !session.revokedAt && new Date(session.expiresAt).getTime() > Date.now();
}

function getSessionViews(userId) {
  return readStoredSessions()
    .filter((session) => session.userId === userId)
    .map((session) => ({
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      id: session.id,
      isActive: isSessionActive(session),
      lastSeenAt: session.lastSeenAt,
      revokedAt: session.revokedAt,
      userId: session.userId
    }));
}

export function mockListUsers() {
  return getMockUsers().map((user) => {
    const sessions = getSessionViews(user.id);

    return {
      ...toPublicUser(user),
      activeSessions: sessions.filter((session) => session.isActive).length,
      canDelete: user.id !== "usr_admin_one",
      createdAt: user.createdAt ?? null,
      isSeedUser: Boolean(user.seedUser),
      sessions
    };
  });
}

export function mockDeleteUser(userId) {
  if (userId === "usr_admin_one") {
    throw new ApiError("O admin principal não pode ser removido.", {
      status: 403
    });
  }

  const user = getMockUsers().find((candidate) => candidate.id === userId);

  if (!user) {
    throw new ApiError("Utilizador não encontrado.", { status: 404 });
  }

  if (user.seedUser) {
    writeDeletedUserIds([...new Set([...readDeletedUserIds(), userId])]);
  } else {
    writeStoredUsers(readStoredUsers().filter((candidate) => candidate.id !== userId));
  }

  mockRevokeUserSessions(userId);

  return { success: true };
}

export function mockRevokeSession(sessionId) {
  let revokedSession = null;
  const now = new Date().toISOString();

  writeStoredSessions(
    readStoredSessions().map((session) => {
      if (session.id !== sessionId) {
        return session;
      }

      revokedSession = {
        ...session,
        revokedAt: session.revokedAt ?? now
      };

      return revokedSession;
    })
  );

  if (!revokedSession) {
    throw new ApiError("Sessão não encontrada.", { status: 404 });
  }

  return revokedSession;
}

export function mockRevokeUserSessions(userId) {
  const now = new Date().toISOString();

  writeStoredSessions(
    readStoredSessions().map((session) =>
      session.userId === userId
        ? { ...session, revokedAt: session.revokedAt ?? now }
        : session
    )
  );

  return { success: true };
}
