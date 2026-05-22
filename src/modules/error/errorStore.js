const APP_ERROR_STORAGE_KEY = "checkpoint.app.error";

const defaultError = {
  actionHref: "#/",
  actionLabel: "Voltar ao início",
  message:
    "Houve uma falha ao comunicar com o serviço. Tenta novamente dentro de momentos.",
  title: "Algo correu mal"
};

function readErrorMessage(error) {
  return (
    error?.data?.message ??
    error?.message ??
    "Erro inesperado na aplicação."
  );
}

export function getStoredAppError() {
  if (typeof window === "undefined") {
    return defaultError;
  }

  try {
    return {
      ...defaultError,
      ...(JSON.parse(window.sessionStorage.getItem(APP_ERROR_STORAGE_KEY)) ?? {})
    };
  } catch {
    return defaultError;
  }
}

export function reportAppError(error, details = {}) {
  const appError = {
    ...defaultError,
    detail: readErrorMessage(error),
    ...details
  };

  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(
      APP_ERROR_STORAGE_KEY,
      JSON.stringify(appError)
    );
    window.location.hash = "#/erro";
  }

  return appError;
}
