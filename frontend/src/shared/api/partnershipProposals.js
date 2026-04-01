import client from './client';

export async function createProposal(data) {
  const { data: res } = await client.post('/partnership-proposals', data);
  return res;
}

export async function getMyProposals() {
  const { data } = await client.get('/partnership-proposals/my');
  return data;
}

export async function getAllProposals(params = {}) {
  const { data } = await client.get('/partnership-proposals/admin/all', { params });
  return data;
}

export async function reviewProposal(id, reviewData) {
  const { data } = await client.patch(`/partnership-proposals/admin/${id}`, reviewData);
  return data;
}
