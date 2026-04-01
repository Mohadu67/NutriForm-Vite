import client from './client';

export async function createOffer(data) {
  const { data: res } = await client.post('/partner-offers', data);
  return res;
}

export async function getMyOffers() {
  const { data } = await client.get('/partner-offers/my');
  return data;
}

export async function updateOffer(id, data) {
  const { data: res } = await client.put(`/partner-offers/${id}`, data);
  return res;
}

export async function deleteOffer(id) {
  const { data } = await client.delete(`/partner-offers/${id}`);
  return data;
}

export async function getPendingOffers() {
  const { data } = await client.get('/partner-offers/admin/pending');
  return data;
}

export async function reviewOffer(id, status) {
  const { data } = await client.patch(`/partner-offers/admin/${id}/review`, { status });
  return data;
}
