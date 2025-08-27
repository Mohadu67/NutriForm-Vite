import client from "./client";
import endpoints from "./endpoints";

export function sendContact(payload) {
  return client.post(endpoints.contact.create, payload);
}