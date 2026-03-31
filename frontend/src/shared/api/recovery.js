import client from './client';

export async function getRecoveryStatus() {
  const { data } = await client.get('/api/recovery/status');
  return data;
}
