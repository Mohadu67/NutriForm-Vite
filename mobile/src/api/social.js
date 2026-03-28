import apiClient from './client';
import { endpoints } from './endpoints';

const social = {
  // Feed
  getFeed: (page = 1) =>
    apiClient.get(endpoints.social.feed, { params: { page, limit: 20 } }),

  // Follow / Unfollow
  follow: (userId) => apiClient.post(endpoints.social.follow(userId)),
  unfollow: (userId) => apiClient.delete(endpoints.social.unfollow(userId)),

  // Stats du user connecté
  getStats: () => apiClient.get(endpoints.social.stats),

  // Profil public d'un user
  getUserProfile: (userId) => apiClient.get(endpoints.social.userProfile(userId)),

  // Listes
  getFollowers: (userId) => apiClient.get(endpoints.social.followers(userId)),
  getFollowing: (userId) => apiClient.get(endpoints.social.following(userId)),

  // Recherche
  searchUsers: (q) => apiClient.get(endpoints.social.search, { params: { q } }),

  // Likes
  likePost: (targetId, targetType = 'workout') =>
    apiClient.post(endpoints.social.likePost(targetId), { targetType }),
  unlikePost: (targetId) =>
    apiClient.delete(endpoints.social.likePost(targetId)),

  // Message direct (suivi mutuel requis)
  sendMessage: (userId, content) =>
    apiClient.post(endpoints.social.sendMessage(userId), { content }),

  // Commentaires
  getComments: (postId) => apiClient.get(endpoints.social.getComments(postId)),
  addComment: (postId, content, postType) =>
    apiClient.post(endpoints.social.addComment(postId), { content, postType }),
  deleteComment: (postId, commentId) =>
    apiClient.delete(endpoints.social.deleteComment(postId, commentId)),
};

export default social;
