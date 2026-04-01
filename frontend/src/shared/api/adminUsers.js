import client from './client';

export async function getUsers(params = {}) {
  const { data } = await client.get('/admin/users', { params });
  return data;
}

export async function getUserStats() {
  const { data } = await client.get('/admin/users/stats');
  return data;
}

export async function banUser(userId, reason = '') {
  const { data } = await client.patch(`/admin/users/${userId}/ban`, { reason });
  return data;
}

export async function unbanUser(userId) {
  const { data } = await client.patch(`/admin/users/${userId}/unban`);
  return data;
}

export async function deleteUser(userId) {
  const { data } = await client.delete(`/admin/users/${userId}`);
  return data;
}

export async function changeUserRole(userId, role) {
  const { data } = await client.patch(`/admin/users/${userId}/role`, { role });
  return data;
}

export async function changeUserTier(userId, tier) {
  const { data } = await client.patch(`/admin/users/${userId}/tier`, { tier });
  return data;
}

export async function giveXp(userId, amount) {
  const { data } = await client.post(`/admin/users/${userId}/xp`, { amount });
  return data;
}
