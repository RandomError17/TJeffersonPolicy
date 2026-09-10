"use client";

/**
 * Browser-side API helper.
 *
 * Every mutation goes through here so the CSRF header is attached exactly
 * once, in one place, and the server's error envelope is unpacked into
 * something a form can render (including per-field messages).
 */

export interface ApiFieldErrors {
  [field: string]: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly fields?: ApiFieldErrors,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function csrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)tjpd_csrf=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "";
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers: {
        "content-type": "application/json",
        "x-csrf-token": csrfToken(),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "same-origin",
    });
  } catch {
    throw new ApiError("Could not reach the server. Check your connection and try again.", 0, "network");
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  let payload: unknown = undefined;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = undefined;
    }
  }

  if (!response.ok) {
    const envelope = (payload as { error?: { message?: string; code?: string; fields?: ApiFieldErrors } })?.error;
    throw new ApiError(
      envelope?.message ?? `Request failed (${response.status}).`,
      response.status,
      envelope?.code ?? "error",
      envelope?.fields,
    );
  }

  return payload as T;
}

export const api = {
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  delete: <T>(path: string, body?: unknown) => request<T>("DELETE", path, body),
};
