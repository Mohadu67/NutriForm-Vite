import client from "./client";
import endpoints from "./endpoints";

export function health() {
  return client.get(endpoints.system.health);
}