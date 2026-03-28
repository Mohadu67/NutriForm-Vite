const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const followController = require('../controllers/follow.controller');

router.use(auth);

router.get('/feed', followController.getFeed);
router.post('/feed/:targetId/like', followController.likePost);
router.delete('/feed/:targetId/like', followController.unlikePost);
router.get('/feed/:postId/comments', followController.getComments);
router.post('/feed/:postId/comments', followController.addComment);
router.delete('/feed/:postId/comments/:commentId', followController.deleteComment);
router.post('/message/:userId', followController.sendMessage);
router.get('/stats', followController.getFollowStats);
router.get('/search', followController.searchUsers);
router.get('/followers/:userId', followController.getFollowers);
router.get('/following/:userId', followController.getFollowing);
router.get('/users/:userId', followController.getUserPublicProfile);
router.post('/follow/:userId', followController.follow);
router.delete('/follow/:userId', followController.unfollow);

module.exports = router;
