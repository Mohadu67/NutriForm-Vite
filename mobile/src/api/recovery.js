import apiClient from './client';

export async function getRecoveryStatus() {
  const { data } = await apiClient.get('/recovery/status');
  return data;
}
