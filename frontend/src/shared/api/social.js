import client from './client';
import { endpoints } from './endpoints';

const social = {
  getFeed: (page = 1, limit = 20) =>
    client.get(endpoints.social.feed, { params: { page, limit } }),

  getStats: () => client.get(endpoints.social.stats),

  follow: (userId) => client.post(endpoints.social.follow(userId)),
  unfollow: (userId) => client.delete(endpoints.social.unfollow(userId)),

  getUserProfile: (userId) => client.get(endpoints.social.userProfile(userId)),

  getFollowers: (userId) => client.get(endpoints.social.followers(userId)),
  getFollowing: (userId) => client.get(endpoints.social.following(userId)),

  searchUsers: (q) => client.get(endpoints.social.search, { params: { q } }),

  likePost: (targetId, targetType = 'workout') =>
    client.post(endpoints.social.likePost(targetId), { targetType }),
  unlikePost: (targetId) =>
    client.delete(endpoints.social.likePost(targetId)),

  sendMessage: (userId, content) =>
    client.post(endpoints.social.sendMessage(userId), { content }),

  getComments: (postId) => client.get(endpoints.social.getComments(postId)),
  addComment: (postId, content, postType) =>
    client.post(endpoints.social.addComment(postId), { content, postType }),
  deleteComment: (postId, commentId) =>
    client.delete(endpoints.social.deleteComment(postId, commentId)),
};

export default social;
