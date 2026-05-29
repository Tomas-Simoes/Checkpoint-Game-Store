import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import { authApi } from "../../api/authApi.js";
import { setApiAuthToken } from "../../api/apiClient.js";
import {
  clearStoredAuthToken,
  getStoredAuthToken,
  storeAuthToken
} from "./authStorage.js";
import { AuthContext } from "./authContext.js";

function readErrorMessage(error) {
  return (
    error?.data?.message ??
    error?.message ??
    "Não foi possível concluir a autenticação."
  );
}

export function AuthProvider({ children }) {
  const [status, setStatus] = useState("checking");
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  const clearSession = useCallback(() => {
    clearStoredAuthToken();
    setApiAuthToken(null);
    setToken(null);
    setUser(null);
    setStatus("anonymous");
  }, []);

  const applySession = useCallback((session) => {
    if (!session?.token || !session?.user) {
      throw new Error("Sessão inválida.");
    }

    storeAuthToken(session.token);
    setApiAuthToken(session.token);
    setToken(session.token);
    setUser(session.user);
    setStatus("authenticated");

    return session;
  }, []);

  const validateSession = useCallback(
    async (sessionToken, options = {}) => {
      const session = await authApi.getSession({
        signal: options.signal,
        token: sessionToken
      });

      return applySession({
        ...session,
        token: session.token ?? sessionToken
      });
    },
    [applySession]
  );


  // check login when app starts
  useEffect(() => {
    const storedToken = getStoredAuthToken();

    if (!storedToken) {
      setStatus("anonymous");
      return undefined;
    }

    let isActive = true;
    const controller = new AbortController();

    setApiAuthToken(storedToken);

    validateSession(storedToken, { signal: controller.signal })
      .then(() => undefined)
      .catch((error) => {
        if (isActive && error.name !== "AbortError") {
          clearSession();
        }
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [applySession, clearSession, validateSession]);

  // validate session every 60s
  useEffect(() => {
    if (status !== "authenticated" || !token) {
      return undefined;
    }

    let controller = null;

    const checkSession = () => {
      controller?.abort();
      controller = new AbortController();

      validateSession(token, { signal: controller.signal }).catch((error) => {
        if (error.name !== "AbortError") {
          clearSession();
        }
      });
    };

    const intervalId = window.setInterval(checkSession, 60 * 1000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkSession();
      }
    };

    window.addEventListener("focus", checkSession);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", checkSession);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      controller?.abort();
    };
  }, [clearSession, status, token, validateSession]);

  const login = useCallback(
    async (credentials) => {
      try {
        const session = await authApi.login(credentials);

        return applySession(session);
      } catch (error) {
        throw new Error(readErrorMessage(error));
      }
    },
    [applySession]
  );

  const register = useCallback(
    async (account) => {
      try {
        const session = await authApi.register(account);

        return applySession(session);
      } catch (error) {
        throw new Error(readErrorMessage(error));
      }
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout({ token });
    } finally {
      clearSession();
    }
  }, [clearSession, token]);

  const value = useMemo(
    () => ({
      isAuthenticated: status === "authenticated",
      isChecking: status === "checking",
      login,
      logout,
      register,
      status,
      token,
      user
    }),
    [login, logout, register, status, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
