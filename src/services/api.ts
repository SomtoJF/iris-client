import { BaseRoute } from "./routes";

export class ApiError extends Error {
  status: number;
  // login/signup 401s mean bad credentials, not an expired session —
  // they must not trigger the global logout redirect
  ignore401: boolean;

  constructor(status: number, message: string, ignore401 = false) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.ignore401 = ignore401;
  }
}

interface ApiFetchOptions extends RequestInit {
  fallbackError?: string;
  ignore401?: boolean;
}

export async function apiFetch(path: string, options: ApiFetchOptions = {}) {
  const { fallbackError, ignore401, ...init } = options;
  const response = await fetch(`${BaseRoute}${path}`, {
    credentials: "include",
    ...init,
  });
  const res = await response.json().catch(() => ({}));
  if (response.status > 299) {
    throw new ApiError(response.status, res.error ?? fallbackError ?? "Request failed", ignore401);
  }
  return res;
}
