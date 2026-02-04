import client from './client';

// ============================================
// REVIEWS
// ============================================

export async function getAllReviews() {
  const response = await client.get('/reviews/users/all');
  return response.data;
}

export async function approveReview(reviewId) {
  const response = await client.put(`/reviews/users/${reviewId}/approve`);
  return response.data;
}

export async function deleteReview(reviewId) {
  const response = await client.delete(`/reviews/users/${reviewId}`);
  return response.data;
}

// ============================================
// NEWSLETTERS
// ============================================

export async function getNewsletters() {
  const response = await client.get('/newsletters/admin');
  return response.data;
}

export async function getNewsletterStats() {
  const response = await client.get('/newsletter/stats');
  return response.data;
}

export async function createNewsletter(newsletterData) {
  const response = await client.post('/newsletters/admin', newsletterData);
  return response.data;
}

export async function updateNewsletter(id, newsletterData) {
  const response = await client.put(`/newsletters/admin/${id}`, newsletterData);
  return response.data;
}

export async function deleteNewsletter(id) {
  const response = await client.delete(`/newsletters/admin/${id}`);
  return response.data;
}

export async function sendNewsletter(id) {
  const response = await client.post(`/newsletters/admin/${id}/send-now`);
  return response.data;
}

// ============================================
// RECIPES
// ============================================

export async function getRecipes() {
  const response = await client.get('/recipes');
  return response.data;
}

export async function getRecipeById(id) {
  const response = await client.get(`/recipes/${id}`);
  return response.data;
}

export async function createRecipe(recipeData) {
  const response = await client.post('/recipes', recipeData);
  return response.data;
}

export async function updateRecipe(id, recipeData) {
  const response = await client.put(`/recipes/${id}`, recipeData);
  return response.data;
}

export async function deleteRecipe(id) {
  const response = await client.delete(`/recipes/${id}`);
  return response.data;
}

// ============================================
// PROGRAMS
// ============================================

export async function getAllPrograms() {
  const response = await client.get('/programs/admin/all');
  return response.data;
}

export async function getPendingPrograms() {
  const response = await client.get('/programs/admin/pending');
  return response.data;
}

export async function createProgram(programData) {
  const response = await client.post('/programs/admin/create', programData);
  return response.data;
}

export async function updateProgram(id, programData) {
  const response = await client.patch(`/programs/admin/${id}`, programData);
  return response.data;
}

export async function deleteProgram(id) {
  const response = await client.delete(`/programs/admin/${id}`);
  return response.data;
}

// ============================================
// SUPPORT TICKETS
// ============================================

export async function getAllSupportTickets(filters = {}) {
  const params = new URLSearchParams(filters);
  const response = await client.get(`/admin/support-tickets?${params}`);
  return response.data;
}

export async function getSupportTicketById(ticketId) {
  const response = await client.get(`/admin/support-tickets/${ticketId}`);
  return response.data;
}

export async function replyToSupportTicket(ticketId, message) {
  const response = await client.post(`/admin/support-tickets/${ticketId}/reply`, {
    message
  });
  return response.data;
}

export async function resolveSupportTicket(ticketId, notes = '', deleteMessages = false) {
  const response = await client.post(`/admin/support-tickets/${ticketId}/resolve`, {
    notes,
    deleteMessages
  });
  return response.data;
}

export async function reopenSupportTicket(ticketId) {
  const response = await client.post(`/admin/support-tickets/${ticketId}/reopen`);
  return response.data;
}

export async function deleteSupportTicket(ticketId, deleteMessages = false) {
  const params = deleteMessages ? '?deleteMessages=true' : '';
  const response = await client.delete(`/admin/support-tickets/${ticketId}${params}`);
  return response.data;
}

export async function assignSupportTicket(ticketId, adminId) {
  const response = await client.post(`/admin/support-tickets/${ticketId}/assign`, {
    adminId
  });
  return response.data;
}

export async function getSupportTicketStats() {
  const response = await client.get('/admin/support-tickets/stats');
  return response.data;
}
