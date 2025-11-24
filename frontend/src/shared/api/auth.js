import client from "./client";
import endpoints from "./endpoints";


export function login(payload) {
  return client.post(endpoints.auth.login, payload);
}

export function register(payload) {
  return client.post(endpoints.auth.register, payload);
}

export function me() {
  return client.get(endpoints.auth.me);
}

export function refresh() {
  return client.post(endpoints.auth.refresh);
}

export function logout() {
  return client.post(endpoints.auth.logout);
}

export async function isAuthenticated() {
  try {
    await me();
    return true;
  } catch (error) {
    return false;
  }
}