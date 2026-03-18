import { AuthResponse } from "@/types/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

const STORAGE_KEYS = {
  ACCESS_TOKEN: "bookshelf-access-token",
  REFRESH_TOKEN: "bookshelf-refresh-token",
  USERNAME: "bookshelf-username",
} as const;

// Listener invoked when tokens are cleared due to an auth failure (expired/revoked).
// AuthProvider subscribes to this so it can update React state and trigger redirect.
type AuthFailureListener = () => void;
let onAuthFailure: AuthFailureListener | null = null;

export function setAuthFailureListener(listener: AuthFailureListener | null): void {
  onAuthFailure = listener;
}

function notifyAuthFailure(): void {
  onAuthFailure?.();
}

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  } catch {
    return null;
  }
}

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  } catch {
    return null;
  }
}

export function getUsername(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.USERNAME);
  } catch {
    return null;
  }
}

export function storeTokens(response: AuthResponse): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
    localStorage.setItem(STORAGE_KEYS.USERNAME, response.username);
  } catch {
    // localStorage unavailable (e.g. private browsing) — tokens will not persist
  }
}

export function clearTokens(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USERNAME);
  } catch {
    // localStorage unavailable — nothing to clear
  }
}

export function isAuthenticated(): boolean {
  return getAccessToken() !== null;
}

export async function checkRegistrationOpen(): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/auth/status`);
  if (!response.ok) return false;
  const data = await response.json();
  return data.registrationOpen;
}

export async function login(
  username: string,
  password: string
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Login failed");
  }

  const data: AuthResponse = await response.json();
  storeTokens(data);
  return data;
}

export async function register(
  username: string,
  password: string
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error("An account already exists");
    }
    const error = await response.text();
    throw new Error(error || "Registration failed");
  }

  const data: AuthResponse = await response.json();
  storeTokens(data);
  return data;
}

export async function refreshTokens(): Promise<AuthResponse> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    clearTokens();
    notifyAuthFailure();
    throw new Error("No refresh token available");
  }

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    clearTokens();
    notifyAuthFailure();
    throw new Error("Token refresh failed");
  }

  const data: AuthResponse = await response.json();
  storeTokens(data);
  return data;
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();

  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
  } finally {
    clearTokens();
  }
}
