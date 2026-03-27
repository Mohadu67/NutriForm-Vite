const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const followController = require('../controllers/follow.controller');

router.use(auth);

router.get('/feed', followController.getFeed);
router.get('/stats', followController.getFollowStats);
router.get('/search', followController.searchUsers);
router.get('/followers/:userId', followController.getFollowers);
router.get('/following/:userId', followController.getFollowing);
router.get('/users/:userId', followController.getUserPublicProfile);
router.post('/follow/:userId', followController.follow);
router.delete('/follow/:userId', followController.unfollow);

module.exports = router;
