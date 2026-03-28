import { jwtDecode } from "jwt-decode";

export const AUTH_TOKEN_KEY = "student-profile-qr-token";

export function getStoredToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredToken(token) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function decodeToken(token) {
  if (!token) return null;

  try {
    return jwtDecode(token);
  } catch {
    return null;
  }
}

export function buildAuthState(token) {
  const user = decodeToken(token);

  if (!token || !user?.role || !user?.id) {
    return {
      token: null,
      user: null,
      isAuthenticated: false,
    };
  }

  return {
    token,
    user,
    isAuthenticated: true,
  };
}
