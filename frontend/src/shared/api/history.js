import client from "./client";
import endpoints from "./endpoints";

export function addHistory(payload) {
  return client.post(endpoints.history.add, payload);
}

export function listHistory() {
  return client.get(endpoints.history.list);
}

export function deleteHistory(id) {
  return client.delete(`${endpoints.history.list}/${id}`);
}

export default { addHistory, listHistory, deleteHistory };