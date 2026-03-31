import client from './client';

export async function getRecoveryStatus() {
  const { data } = await client.get('/recovery/status');
  return data;
}
